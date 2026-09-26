/** Offline generation only: the API key is never sent to the browser or written to disk. */
import { mkdir,readFile,writeFile,rename,rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { AUDIO_LESSONS } from '../js/mastery-content.js';
const root=new URL('../',import.meta.url),out=new URL('audio/',root),temp=new URL('.audio-build/',root);
const model='gpt-4o-mini-tts',voice='marin',sampleRate=24000;
const instructions='You are a patient, clear American English accounting tutor. Speak at a calm, natural pace, with short pauses between calculations. Sound conversational, warm, and focused. Read every word as written. Do not add words. Do not imitate a real person. Emphasize beginning versus ending, plus versus minus, and BOTH sides. Pronounce accounting terms clearly.';
const hash=createHash('sha256').update(JSON.stringify({AUDIO_LESSONS,model,voice,instructions})).digest('hex').slice(0,12);
if(process.argv.includes('--validate')){for(const l of AUDIO_LESSONS)for(const s of l.segments){if(!s.text||s.text.length>3900)throw Error('Invalid or overlong segment in '+l.id);}console.log(`${AUDIO_LESSONS.length} lessons, ${AUDIO_LESSONS.reduce((n,l)=>n+l.segments.length,0)} segments validated. Content hash: ${hash}`);process.exit(0);}
const key=process.env.OPENAI_API_KEY;
if(!key){console.error('Missing OPENAI_API_KEY. Add it as a private GitHub Actions secret, then run the Generate lesson audio workflow.');process.exit(1);}
if(spawnSync('ffmpeg',['-version'],{stdio:'ignore'}).status!==0)throw Error('ffmpeg is required to encode downloadable MP3s.');
const old=await readFile(new URL('manifest.json',out),'utf8').then(JSON.parse).catch(()=>null);
if(old?.hash===hash&&old.tracks.every(t=>existsSync(new URL(t.url,root)))){console.log('The audio already matches these scripts. No paid API requests made.');process.exit(0);}
await mkdir(temp,{recursive:true});await mkdir(out,{recursive:true});
const silence=seconds=>Buffer.alloc(Math.round(sampleRate*2*seconds));
async function speech(text){const response=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,voice,input:text,instructions,response_format:'pcm',speed:1}),signal:AbortSignal.timeout(180000)});if(!response.ok)throw Error(`OpenAI speech request failed with HTTP ${response.status}. Check API billing and key permissions. No audio was published.`);const bytes=Buffer.from(await response.arrayBuffer());if(!bytes.length||bytes.length%2)throw Error('Invalid PCM audio response.');return bytes;}
function wav(pcm){const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(sampleRate,24);h.writeUInt32LE(sampleRate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm]);}
async function encode(id,title,pcm,segments){const source=new URL(id+'.wav',temp),name=id+'-'+hash+'.mp3',target=new URL(name,temp);await writeFile(source,wav(pcm));const result=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',source.pathname,'-codec:a','libmp3lame','-b:a','96k',target.pathname],{stdio:'inherit'});if(result.status!==0)throw Error('MP3 encoding failed.');return {id,title,url:'audio/'+name,duration:pcm.length/(sampleRate*2),segments};}
const all=[],tracks=[];let courseOffset=0;const courseSegments=[];
try{for(const lesson of AUDIO_LESSONS){console.log('Generating '+lesson.title);const pieces=[],segments=[];let offset=0;for(const [index,s] of lesson.segments.entries()){const segmentHash=createHash('sha256').update(hash+lesson.id+index).digest('hex').slice(0,20),cached=new URL(segmentHash+'.pcm',temp);let pcm;try{pcm=await readFile(cached);}catch{pcm=await speech(s.text);await writeFile(cached,pcm);}const pause=silence(s.pause||.65);pieces.push(pcm,pause);const duration=(pcm.length+pause.length)/(sampleRate*2);segments.push({start:offset,end:offset+duration});offset+=duration;}const joined=Buffer.concat(pieces);tracks.push(await encode(lesson.id,lesson.title,joined,segments));courseSegments.push({start:courseOffset,end:courseOffset+offset,lesson:lesson.id});all.push(joined,silence(2));courseOffset+=offset+2;}
 tracks.push(await encode('complete','The complete accounting study walk',Buffer.concat(all),courseSegments));
 // Publish the manifest only after every MP3 has been successfully generated.
 for(const t of tracks)await rename(new URL(t.url.split('/').at(-1),temp),new URL(t.url,root));
 await writeFile(new URL('manifest.json',out),JSON.stringify({version:1,hash,model,voice,aiGenerated:true,createdAt:new Date().toISOString(),tracks},null,2)+'\n');
 console.log('Generated all lessons and the continuous study walk. Replay does not call OpenAI.');await rm(temp,{recursive:true,force:true});
}catch(error){console.error(error.message);process.exitCode=1;}
