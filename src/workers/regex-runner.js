// Untrusted regex executes off the UI thread; the caller enforces a hard timeout.
self.onmessage=event=>{
 const {pattern,flags,text}=event.data||{};
 try{
  if(typeof pattern!=='string'||pattern.length>2000||typeof text!=='string'||text.length>100000)throw Error('Limit: 2,000 pattern characters and 100,000 input characters');
  const rx=new RegExp(pattern,flags.includes('g')?flags:flags+'g'),rows=[];
  for(const match of text.matchAll(rx)){
   rows.push(`#${rows.length+1} [${match.index}]: ${JSON.stringify(match[0].slice(0,1000))}${match.length>1?' groups: '+JSON.stringify(match.slice(1)).slice(0,2000):''}`);
   if(rows.length>=500){rows.push('Stopped at 500 matches. Narrow the pattern to see more.');break;}
  }
  self.postMessage({text:rows.join('\n')||'0 matches'});
 }catch(error){self.postMessage({text:'Regex error: '+error.message});}
};
