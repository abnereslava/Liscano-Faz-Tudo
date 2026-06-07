// Galeria "Serviços & Trabalhos": monta os cards a partir de window.PORTFOLIO
// (img/portfolio/manifest.js, gerado automaticamente) e controla modal + lightbox.
(function () {
    const grid = document.getElementById('stGrid');
    if (!grid || !window.PORTFOLIO) return;

    const modal = document.getElementById('galeriaModal');
    const galGrid = document.getElementById('galGrid');
    const galIcon = document.getElementById('galIcon');
    const galTitulo = document.getElementById('galTitulo');
    const galDesc = document.getElementById('galDesc');
    const lightbox = document.getElementById('galeriaLightbox');
    const plImg = document.getElementById('plImg');
    const plContador = document.getElementById('plContador');

    let categoriaAtual = [];
    let indiceAtual = 0;

    // ---- Monta os cards de serviço (capa = 1ª foto da categoria) ----
    Object.entries(window.PORTFOLIO).forEach(([slug, cat]) => {
        const temFotos = cat.fotos && cat.fotos.length;
        const card = document.createElement('div');
        card.className = 'st-card' + (temFotos ? '' : ' st-em-breve');

        if (temFotos) {
            card.style.backgroundImage = `url('${cat.fotos[0].thumb}')`;
            card.innerHTML = `
                <div class="st-card-body">
                    <span class="st-icon"><i class='bx ${cat.icon}'></i></span>
                    <h3>${cat.label}</h3>
                    <p>${cat.desc}</p>
                    <span class="st-cta">Ver trabalhos <i class='bx bx-right-arrow-alt'></i></span>
                </div>`;
            card.addEventListener('click', () => abrirGaleria(slug));
        } else {
            card.innerHTML = `
                <span class="st-badge st-badge-breve">Fotos em breve</span>
                <div class="st-card-body">
                    <span class="st-icon"><i class='bx ${cat.icon}'></i></span>
                    <h3>${cat.label}</h3>
                    <p>${cat.desc}</p>
                </div>`;
        }
        grid.appendChild(card);
    });

    // ---- Modal galeria ----
    function abrirGaleria(slug) {
        const cat = window.PORTFOLIO[slug];
        categoriaAtual = cat.fotos;
        galIcon.className = 'bx ' + cat.icon;
        galTitulo.textContent = cat.label;
        galDesc.textContent = cat.fotos.length + (cat.fotos.length === 1 ? ' foto' : ' fotos');
        galGrid.innerHTML = '';
        cat.fotos.forEach((foto, i) => {
            const img = document.createElement('img');
            img.src = foto.thumb;
            img.loading = 'lazy';
            img.alt = foto.alt;
            img.addEventListener('click', () => abrirLightbox(i));
            galGrid.appendChild(img);
        });
        galGrid.scrollTop = 0;
        // Entrada no historico: o botao "voltar" do celular fecha a galeria
        history.pushState({ galeria: slug }, '');
        modal.classList.add('aberto');
        document.body.style.overflow = 'hidden';
    }
    // Esconde de fato (usado pelo popstate). A UI chama fecharGaleria() -> history.back()
    function hideGaleria() {
        modal.classList.remove('aberto');
        document.body.style.overflow = '';
    }
    function fecharGaleria() {
        if (modal.classList.contains('aberto')) history.back();
    }

    // ---- Lightbox ----
    function abrirLightbox(i) {
        indiceAtual = i;
        atualizarLightbox();
        // Nova entrada no historico: "voltar" fecha a foto antes da galeria
        history.pushState({ lightbox: true }, '');
        lightbox.classList.add('aberto');
    }
    function atualizarLightbox() {
        const foto = categoriaAtual[indiceAtual];
        plImg.style.opacity = '0';
        plImg.onload = () => { plImg.style.opacity = '1'; };
        plImg.src = foto.full;
        plImg.alt = foto.alt;
        plContador.textContent = (indiceAtual + 1) + ' / ' + categoriaAtual.length;
    }
    function navLightbox(dir) {
        indiceAtual = (indiceAtual + dir + categoriaAtual.length) % categoriaAtual.length;
        atualizarLightbox();
    }
    function hideLightbox() { lightbox.classList.remove('aberto'); }
    function fecharLightbox() {
        if (lightbox.classList.contains('aberto')) history.back();
    }

    // ---- Eventos ----
    document.getElementById('galFechar').addEventListener('click', fecharGaleria);
    document.getElementById('plFechar').addEventListener('click', fecharLightbox);
    document.getElementById('plPrev').addEventListener('click', () => navLightbox(-1));
    document.getElementById('plNext').addEventListener('click', () => navLightbox(1));

    modal.addEventListener('click', (e) => { if (e.target === modal) fecharGaleria(); });
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) fecharLightbox(); });

    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('aberto')) {
            if (e.key === 'ArrowRight') navLightbox(1);
            else if (e.key === 'ArrowLeft') navLightbox(-1);
            else if (e.key === 'Escape') fecharLightbox();
        } else if (modal.classList.contains('aberto') && e.key === 'Escape') {
            fecharGaleria();
        }
    });

    // Botao "voltar" do celular: fecha a foto/galeria em vez de sair do site
    window.addEventListener('popstate', () => {
        if (lightbox.classList.contains('aberto')) hideLightbox();
        else if (modal.classList.contains('aberto')) hideGaleria();
    });

    // Swipe para o lado navega entre as fotos no lightbox (mobile)
    let touchStartX = 0, touchStartY = 0;
    lightbox.addEventListener('touchstart', (e) => {
        const t = e.changedTouches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
    }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        // Swipe horizontal claro (ignora rolagem vertical / toques pequenos)
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
            navLightbox(dx < 0 ? 1 : -1);
        }
    }, { passive: true });
})();
