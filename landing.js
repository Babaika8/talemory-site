const menuButton=document.querySelector('.menuButton');const nav=document.querySelector('.siteNav');
menuButton?.addEventListener('click',()=>{const opened=document.body.classList.toggle('menuOpen');menuButton.setAttribute('aria-expanded',String(opened));});
nav?.addEventListener('click',e=>{if(e.target.closest('a')){document.body.classList.remove('menuOpen');menuButton?.setAttribute('aria-expanded','false');}});
const rail=document.querySelector('[data-gallery]');const moveGallery=direction=>{const card=rail?.querySelector('.galleryCard');if(!rail||!card)return;rail.scrollBy({left:direction*(card.getBoundingClientRect().width+24),behavior:'smooth'});};
document.querySelector('[data-gallery-prev]')?.addEventListener('click',()=>moveGallery(-1));document.querySelector('[data-gallery-next]')?.addEventListener('click',()=>moveGallery(1));
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('isVisible');observer.unobserve(entry.target);}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));}else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('isVisible'));

const previewTools=document.querySelector('[data-preview-tools]');const previewModal=document.querySelector('[data-preview-modal]');const previewFrame=document.querySelector('[data-preview-frame]');const previewCanvas=document.querySelector('[data-preview-canvas]');const previewLabel=document.querySelector('[data-preview-size-label]');
if(new URLSearchParams(location.search).has('previewFrame'))previewTools?.setAttribute('hidden','');
const setPreviewMode=mode=>{if(!previewCanvas)return;const mobile=mode==='mobile';previewCanvas.classList.toggle('isMobile',mobile);previewCanvas.classList.toggle('isDesktop',!mobile);previewLabel.textContent=mobile?'Мобильная версия · 390 × 844':'Версия для ПК · 1280 × 800';document.querySelectorAll('[data-preview-mode]').forEach(button=>button.classList.toggle('isActive',button.dataset.previewMode===mode));};
const openPreview=mode=>{if(!previewModal||!previewFrame)return;setPreviewMode(mode);if(!previewFrame.src){const url=new URL(location.origin+location.pathname);url.searchParams.set('previewFrame','1');previewFrame.src=url.href;}previewModal.hidden=false;document.body.classList.add('previewOpen');};
const closePreview=()=>{if(!previewModal)return;previewModal.hidden=true;document.body.classList.remove('previewOpen');};
document.querySelectorAll('[data-preview-open]').forEach(button=>button.addEventListener('click',()=>openPreview(button.dataset.previewOpen)));
document.querySelectorAll('[data-preview-mode]').forEach(button=>button.addEventListener('click',()=>setPreviewMode(button.dataset.previewMode)));
document.querySelectorAll('[data-preview-close]').forEach(button=>button.addEventListener('click',closePreview));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&previewModal&&!previewModal.hidden)closePreview();});
