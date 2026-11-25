// One appearance preference shared by shell, native apps and later-created windows.
(() => {
  const device=window.matchMedia?.('(prefers-color-scheme: dark)');
  const reduced=window.matchMedia?.('(prefers-reduced-transparency: reduce)');
  function apply(){
    const prefs=SystemState.settings,root=document.documentElement;
    const preference=['day','night','auto'].includes(prefs.system_appearance)?prefs.system_appearance:'auto';
    const mode=preference==='auto'?(device?.matches?'night':'day'):preference;
    const clarity=['clear','balanced','solid'].includes(prefs.glass_clarity)?prefs.glass_clarity:'balanced';
    root.dataset.systemMode=mode;root.dataset.appearancePreference=preference;
    root.dataset.glassClarity=reduced?.matches?'solid':clarity;
    root.classList.toggle('dark',mode==='night');root.style.colorScheme=mode==='night'?'dark':'light';
    const status=document.getElementById('system-appearance-status');
    if(status)status.textContent=`${preference==='auto'?'Auto → ':''}${mode==='day'?'Day':'Night'} · ${reduced?.matches?'Solid (device reduced-transparency preference)':clarity+' glass'}`;
    window.AetherDesign?.refreshIconAppearance();
    window.dispatchEvent(new CustomEvent('aether:appearance-change',{detail:{mode,preference,clarity:root.dataset.glassClarity}}));
  }
  function set(key,value){
    if(key==='system_appearance'&&!['day','night','auto'].includes(value))return;
    if(key==='glass_clarity'&&!['clear','balanced','solid'].includes(value))return;
    if(!['system_appearance','glass_clarity'].includes(key))return;
    SystemState.settings[key]=value;SystemState.save?.();apply();
  }
  device?.addEventListener?.('change',()=>{if(SystemState.settings.system_appearance==='auto'||!SystemState.settings.system_appearance)apply();});
  reduced?.addEventListener?.('change',apply);
  document.addEventListener('DOMContentLoaded',apply,{once:true});
  window.addEventListener('focus',apply);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply();});
  window.AetherAppearance={apply,set};apply();
})();
