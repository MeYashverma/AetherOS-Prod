// Read the current playback adapter, not the retired audioStream clock.
export function musicActivity(state,player){
 if(!state.song)return null;
 const song=state.song,lines=state.lyrics?.lines||[],time=Math.max(0,Number(player.time)||0),duration=Math.max(0,Number(player.duration)||0);
 const clock=!!player.mode&&Number.isFinite(Number(player.time));
 const estimated=!!state.lyrics?.estimated;
 let index=-1;if(clock)for(let i=0;i<lines.length;i++){if(Number(lines[i].t??lines[i].time)>time+(state.offset||0))break;index=i;}
 return {id:JSON.stringify([song.artist||'',song.title||song.name||'']),title:song.title||song.name,artist:song.artist||'',artwork:song.artwork||song.coverUrl||'',episode:!!song.episodeUrl,active:!!player.mode||state.phase==='resolving',playing:!!player.playing,phase:state.phase||'ready',time,duration,clock,volume:player.volume,lines,lyricIndex:index,estimated,source:state.source||'',offset:state.offset||0};
}
