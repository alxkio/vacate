'use strict';
// Public UI simulation only. No backend authentication, secrets or authorization.
(() => {
  const key = 'vacate.demo.account.v2';
  function currentUser() {
    try {
      const id=sessionStorage.getItem(key),current=window.VacateFixtures.person(id);
      if(!current){sessionStorage.removeItem(key);return null;}
      return current;
    } catch {return null;}
  }
  function login(username,password) {
    const alias={user:'maya',admin:'nora'}[username];
    const current=alias?window.VacateFixtures.person(alias):window.VacateFixtures.people.find(person=>person.username===username);
    if(!current||password!==username)return false;
    sessionStorage.removeItem('vacate.demo.account.v1');
    sessionStorage.setItem(key,current.id);
    return true;
  }
  function logout() {
    try{sessionStorage.removeItem(key);sessionStorage.removeItem('vacate.demo.account.v1');}catch{/* Already signed out. */}
    location.replace(new URL('login.html',location.href).href);
  }
  window.VacateDemo=Object.freeze({currentUser,login,logout});
  function guard(){
    const page=document.documentElement.dataset.demoPage,current=currentUser();
    const destination=page==='calendar'&&!current?'login.html':page==='login'&&current?'index.html':null;
    if(destination){document.documentElement.dataset.demoSession='redirect';location.replace(new URL(destination,location.href).href);}
  }
  guard();
  window.addEventListener('pageshow',event=>{guard();if(event.persisted&&document.documentElement.dataset.demoPage==='calendar')location.reload();});
})();
