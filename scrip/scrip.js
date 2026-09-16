// --- Conexión a Supabase ---
const SUPABASE_URL = 'https://hvkopgmaavkzbitngnzk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cJZVL9IDyaLCs2jYDbezWQ_E6PGEZsE';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// --- Música de fondo para la pagina ---
const btnSonido = document.getElementById('btn-sonido');
if(btnSonido){
    const musica = document.getElementById('musica-fondo');
    const icono = btnSonido.querySelector('box-icon');
    let sonando = false;

    btnSonido.addEventListener('click', () => {
        if (!sonando) {
            musica.contentWindow.postMessage(
                '{"event":"command","func":"playVideo","args":""}',
                '*'
            );
            icono.setAttribute('name', 'volume-full');
        } else {
            musica.contentWindow.postMessage(
                '{"event":"command","func":"stopVideo","args":""}',
                '*'
            );
            icono.setAttribute('name', 'volume-mute');
        }
        sonando = !sonando;
    });
}


// --- Chat del confesionario ---
const chatMensajes = document.getElementById('chat-mensajes');

if(chatMensajes){
    const inputMensaje = document.getElementById('input-mensaje');
    const btnEnviar = document.getElementById('btn-enviar');

    const respuestasConfesor = [
        "Continúa. Aquí nada se juzga.",
        "El silencio también dice mucho... pero sigue.",
        "Cada palabra tuya queda entre estas paredes.",
        "Interesante confesión. ¿Hay algo más que quieras soltar?",
        "Te escucho. No te detengas ahora."
    ];

    let estadoChat = 'apodo';
    let apodoUsuario = '';
    let ultimoPecado = '';

    function agregarMensaje(texto, tipo, contenedor = chatMensajes, nombre = ''){
        const div = document.createElement('div');
        div.className = `mensaje ${tipo}`;

        if(nombre){
            const autor = document.createElement('span');
            autor.className = 'autor-mensaje';
            autor.textContent = nombre;
            div.appendChild(autor);
        }

        const p = document.createElement('p');
        p.textContent = texto;

        div.appendChild(p);
        contenedor.appendChild(div);

        contenedor.scrollTop = contenedor.scrollHeight;
    }

    function enviarMensaje(){
        const texto = inputMensaje.value.trim();
        if(!texto) return;

        agregarMensaje(texto, 'enviado');
        inputMensaje.value = '';

        if(estadoChat === 'apodo'){
            apodoUsuario = texto;

            setTimeout(() => {
                agregarMensaje(`Un placer, ${apodoUsuario}. Ahora dime, ¿qué pecado cargas contigo?`, 'recibido');
                estadoChat = 'confesion';
            }, 1000);

            return;
        }

        ultimoPecado = texto;

        setTimeout(() => {
            const respuesta = respuestasConfesor[Math.floor(Math.random() * respuestasConfesor.length)];
            agregarMensaje(respuesta, 'recibido');

            setTimeout(() => {
                agregarPreguntaDecision();
            }, 1000);

        }, 1200);
    }

    function agregarPreguntaDecision(){
        const div = document.createElement('div');
        div.className = 'mensaje recibido';

        const p = document.createElement('p');
        p.textContent = '¿Quieres compartir tu pecado con otras almas, o que quede solo entre nosotros?';
        div.appendChild(p);

        const btnCompartir = document.createElement('button');
        btnCompartir.className = 'btn-decision';
        btnCompartir.textContent = 'Compartir con otros';
        btnCompartir.addEventListener('click', async () => {
            await compartirConfesion();
            abrirPanelDecision();
        });

        const btnPrivado = document.createElement('button');
        btnPrivado.className = 'btn-decision';
        btnPrivado.textContent = 'Que quede entre nosotros';
        btnPrivado.addEventListener('click', () => {
            agregarMensaje('Como prefieras. Tu secreto está a salvo conmigo.', 'recibido');
        });

        div.appendChild(btnCompartir);
        div.appendChild(btnPrivado);

        chatMensajes.appendChild(div);
        chatMensajes.scrollTop = chatMensajes.scrollHeight;
    }

    async function compartirConfesion(){
        const { error } = await sb
            .from('confesiones')
            .insert({ apodo: apodoUsuario || 'Anónimo', pecado: ultimoPecado, compartido: true });

        if(error){
            console.error('Error al guardar la confesión:', error);
        }
    }

    btnEnviar.addEventListener('click', enviarMensaje);

    inputMensaje.addEventListener('keydown', (evento) => {
        if(evento.key === 'Enter'){
            enviarMensaje();
        }
    });


    // --- Panel de "otras almas" (compartido) ---
    const panelBienvenida = document.getElementById('panel-bienvenida');
    const panelMensajes = document.getElementById('panel-mensajes');
    const inputPanel = document.getElementById('input-panel');
    const btnEnviarPanel = document.getElementById('btn-enviar-panel');
    const btnPanelToggle = document.getElementById('btn-panel-toggle');

    async function cargarConfesionesCompartidas(){
        panelMensajes.innerHTML = '';

        const { data, error } = await sb
            .from('confesiones')
            .select()
            .eq('compartido', true)
            .order('created_at', { ascending: false });

        if(error){
            console.error('Error al cargar confesiones:', error);
            agregarMensaje('No se pudieron cargar las confesiones. Intenta de nuevo.', 'recibido', panelMensajes, 'El confesor');
            return;
        }

        if(data.length === 0){
            agregarMensaje('Aún no hay confesiones compartidas. Sé el primero en soltar la tuya.', 'recibido', panelMensajes, 'El confesor');
            return;
        }

        data.forEach(confesion => {
            agregarMensaje(confesion.pecado, 'enviado', panelMensajes, confesion.apodo || 'Anónimo');
        });
    }

    async function abrirPanelDecision(){
        const panel = document.getElementById('panel-decision');
        panel.classList.add('abierto');
        document.body.classList.add('panel-abierto');

        panelBienvenida.textContent = `Bienvenido al chat de pecadores, ${apodoUsuario || 'alma anónima'}. Tu pecado queda entre nosotros.`;

        await cargarConfesionesCompartidas();
    }

    btnPanelToggle.addEventListener('click', async () => {
        const panel = document.getElementById('panel-decision');
        const seVaAAbrir = !panel.classList.contains('abierto');

        panel.classList.toggle('abierto');
        document.body.classList.toggle('panel-abierto');

        if(seVaAAbrir){
            panelBienvenida.textContent = `Bienvenido a la sala de los pecadores, ${apodoUsuario || 'alma anónima'}.`;
            await cargarConfesionesCompartidas();
        }
    });

    async function enviarMensajePanel(){
        const texto = inputPanel.value.trim();
        if(!texto) return;

        inputPanel.value = '';

        const { error } = await sb
            .from('confesiones')
            .insert({ apodo: apodoUsuario || 'Anónimo', pecado: texto, compartido: true });

        if(error){
            console.error('Error al enviar mensaje:', error);
            return;
        }

        await cargarConfesionesCompartidas();
    }

    btnEnviarPanel.addEventListener('click', enviarMensajePanel);

    inputPanel.addEventListener('keydown', (evento) => {
        if(evento.key === 'Enter'){
            enviarMensajePanel();
        }
    });
}


// --- Formulario de recomendación de libros ---
const formLibro = document.getElementById('form-libro');

if(formLibro){
    const estrellas = document.querySelectorAll('.estrella');
    let calificacionSeleccionada = 0;

    estrellas.forEach(estrella => {
        estrella.addEventListener('click', () => {
            calificacionSeleccionada = parseInt(estrella.dataset.valor);
            pintarEstrellas(calificacionSeleccionada);
        });
    });

    function pintarEstrellas(valor){
        estrellas.forEach(estrella => {
            const valorEstrella = parseInt(estrella.dataset.valor);
            if(valorEstrella <= valor){
                estrella.setAttribute('type', 'solid');
                estrella.style.color = '#f5c518';
                estrella.classList.add('activa');
            } else {
                estrella.setAttribute('type', 'regular');
                estrella.style.color = '';
                estrella.classList.remove('activa');
            }
        });
    }

    const inputFoto = document.getElementById('input-foto');
    const previewFoto = document.getElementById('preview-foto');

    inputFoto.addEventListener('change', () => {
        const archivo = inputFoto.files[0];

        if(archivo){
            const lector = new FileReader();

            lector.onload = (evento) => {
                previewFoto.src = evento.target.result;
                previewFoto.hidden = false;
            };

            lector.readAsDataURL(archivo);
        }
    });

    const pasos = document.querySelectorAll('.paso');
    let pasoActual = 1;

    function mostrarPaso(numero){
        pasos.forEach(paso => {
            paso.classList.toggle('activo', parseInt(paso.dataset.paso) === numero);
        });
    }

    document.querySelectorAll('.btn-siguiente').forEach(boton => {
        boton.addEventListener('click', () => {
            pasoActual++;
            mostrarPaso(pasoActual);
        });
    });

    document.querySelectorAll('.btn-atras').forEach(boton => {
        boton.addEventListener('click', () => {
            pasoActual--;
            mostrarPaso(pasoActual);
        });
    });

    formLibro.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const nombreLibro = document.getElementById('input-nombre-libro').value.trim();
        const autor = document.getElementById('input-autor').value.trim();

        if(!nombreLibro || !autor || calificacionSeleccionada === 0){
            alert('Completa el nombre, el autor y selecciona una calificación.');
            return;
        }

        const imagenBase64 = previewFoto.hidden ? null : previewFoto.src;

        const { error } = await sb
            .from('libros_recomendados')
            .insert({
                nombre_libro: nombreLibro,
                autor: autor,
                calificacion: calificacionSeleccionada,
                imagen: imagenBase64
            });

        if(error){
            console.error('Error al guardar la recomendación:', error);
            alert('Hubo un problema al guardar tu recomendación. Intenta de nuevo.');
            return;
        }

        formLibro.style.display = 'none';
        document.getElementById('mensaje-exito').classList.add('mostrar');
    });
}


// --- Lista de libros recomendados (agrupados y ordenados) ---
const gridLibros = document.getElementById('grid-libros');

if(gridLibros){
    async function cargarLibros(){
        const { data, error } = await sb
            .from('libros_recomendados')
            .select()
            .order('created_at', { ascending: false });

        if(error){
            console.error('Error al cargar libros:', error);
            gridLibros.innerHTML = '<p class="cargando-libros">No se pudieron cargar los libros.</p>';
            return;
        }

        if(data.length === 0){
            gridLibros.innerHTML = '<p class="cargando-libros">Aún nadie ha recomendado un libro.</p>';
            return;
        }

        const librosAgrupados = {};

        data.forEach(item => {
            const clave = item.nombre_libro.trim().toLowerCase();

            if(!librosAgrupados[clave]){
                librosAgrupados[clave] = {
                    nombre_libro: item.nombre_libro,
                    autor: item.autor,
                    imagen: item.imagen,
                    sumaCalificaciones: 0,
                    vecesRecomendado: 0
                };
            }

            librosAgrupados[clave].sumaCalificaciones += item.calificacion;
            librosAgrupados[clave].vecesRecomendado += 1;

            if(item.imagen && !librosAgrupados[clave].imagen){
                librosAgrupados[clave].imagen = item.imagen;
            }
        });

        const listaLibros = Object.values(librosAgrupados).map(libro => {
            const promedio = libro.sumaCalificaciones / libro.vecesRecomendado;
            return {
                ...libro,
                promedio: promedio,
                puntuacionCombinada: promedio * libro.vecesRecomendado
            };
        });

        listaLibros.sort((a, b) => b.puntuacionCombinada - a.puntuacionCombinada);

        gridLibros.innerHTML = '';

        listaLibros.forEach(libro => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-libro';

            const portada = libro.imagen
                ? `<img src="${libro.imagen}" alt="Portada de ${libro.nombre_libro}">`
                : `<div class="sin-portada">Sin portada</div>`;

            const promedioRedondeado = Math.round(libro.promedio);
            const estrellasHtml = Array.from({ length: 5 }, (_, i) =>
                `<box-icon name='star' type='${i < promedioRedondeado ? "solid" : "regular"}'></box-icon>`
            ).join('');

            tarjeta.innerHTML = `
                ${portada}
                <h3>${libro.nombre_libro}</h3>
                <p class="autor-libro">${libro.autor}</p>
                <div class="estrellas-tarjeta">${estrellasHtml}</div>
                <p class="veces-recomendado">Recomendado ${libro.vecesRecomendado} ${libro.vecesRecomendado === 1 ? 'vez' : 'veces'}</p>
            `;

            gridLibros.appendChild(tarjeta);
        });
    }

    cargarLibros();
}