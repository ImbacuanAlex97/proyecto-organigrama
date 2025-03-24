document.addEventListener('DOMContentLoaded', function () {
    const organigramaEl = document.getElementById('organigrama');
    const btnCrearPrincipal = document.getElementById('btn-crear-principal');
    const formEdicion = document.getElementById('form-edicion');
    const inputNodoId = document.getElementById('nodo-id');
    const inputNombreNodo = document.getElementById('nombre-nodo');
    const selectCargoNodo = document.getElementById('cargo-nodo');
    const btnGuardar = document.getElementById('btn-guardar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnEliminar = document.getElementById('btn-eliminar');
    const zoomControls = document.createElement('div');

    // Configuración del organigrama
    const config = {
        nodoAncho: 150,
        nodoAlto: 80,
        margenHorizontal: 50,
        margenVertical: 110,
        distanciaEntreHermanos: 180,
        escala: 1,
        minEscala: 0.5,
        maxEscala: 2,
        pasoEscala: 0.1
    };

    // Variables de estado
    let currentZoom = 1;
    const zoomStep = 0.1;
    const maxZoom = 3;
    const minZoom = 0.3;
    let nodos = [];
    let nodoSeleccionado = null;
    let dragging = false;

    // Elementos DOM
    const organigramaViewport = document.getElementById('organigrama-viewport');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    const btnPrint = document.getElementById('btn-print');

    // Inicializar controles de zoom
    function inicializarControlesZoom() {
        zoomControls.className = 'zoom-controls';
        zoomControls.innerHTML = `
            <button id="btn-zoom-in">+</button>
            <button id="btn-zoom-out">-</button>
            <button id="btn-zoom-reset">Reset</button>
        `;
        document.querySelector('.organigrama-container').appendChild(zoomControls);

        document.getElementById('btn-zoom-in').addEventListener('click', () => aplicarZoom(config.pasoEscala));
        document.getElementById('btn-zoom-out').addEventListener('click', () => aplicarZoom(-config.pasoEscala));
        document.getElementById('btn-zoom-reset').addEventListener('click', () => resetZoom());
    }

    // Función para aplicar zoom
    function applyZoom(zoom) {
        currentZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
        organigramaEl.style.transform = `scale(${currentZoom})`;
        organigramaEl.style.transformOrigin = 'top left';
    }
    
    // Función para imprimir
    function printOrganigrama() {
        // Crear una nueva ventana para impresión
        const printWindow = window.open('', '_blank');
        
        // Capturar todos los estilos del documento actual
        const styles = Array.from(document.styleSheets)
            .map(styleSheet => {
                try {
                    return Array.from(styleSheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch (e) {
                    console.log('Error al acceder a cssRules de hoja de estilos');
                    return '';
                }
            })
            .join('\n');
        
        // Capturar el contenido del organigrama
        const organigramaHTML = organigramaEl.outerHTML;
        
        // Estilos específicos para impresión
        const printSpecificStyles = `
            body { 
                margin: 0; 
                padding: 20px;
                background-color: white;
            }
            .organigrama {
                transform-origin: top left;
                position: relative;
                margin: 0 auto;
            }
            .nodo {
                position: absolute;
                min-width: 150px;
                padding: 10px;
                border-radius: 5px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                font-size: 12pt;
                color: black;
            }
            /* Colores específicos para niveles (igual que en la aplicación) */
            .nivel-1 {
                background-color: #e3f2fd !important;
                border: 2px solid #2196f3 !important;
            }
            .nivel-2 {
                background-color: #e8f5e9 !important;
                border: 2px solid #4caf50 !important;
            }
            .nivel-3 {
                background-color: #fff3e0 !important;
                border: 2px solid #ff9800 !important;
            }
            .nivel-4 {
                background-color: #fce4ec !important;
                border: 2px solid #e91e63 !important;
            }
            .nivel-5 {
                background-color: #f3e5f5 !important;
                border: 2px solid #9c27b0 !important;
            }
            .conexion {
                position: absolute;
                background-color: #555 !important;
            }
            .conexion-directa {
                border-top: 2px solid #555 !important;
            }
            .conexion-asesoria {
                border-top: 2px dashed #555 !important;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            }
        `;
        
        // Escribir todo el contenido en la nueva ventana
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Organigrama - Impresión</title>
                <style>
                    ${styles}
                    ${printSpecificStyles}
                </style>
            </head>
            <body>
                <h1>Organigrama</h1>
                <div id="printable-organigrama">
                    ${organigramaHTML}
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.focus();
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }
    
    // Función para ajustar el tamaño del organigrama
    function adjustOrganigramaSize() {
        // Encontrar los bordes del organigrama
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
        
        document.querySelectorAll('.nodo').forEach(nodo => {
            const rect = nodo.getBoundingClientRect();
            const x = parseInt(nodo.style.left);
            const y = parseInt(nodo.style.top);
            const width = rect.width;
            const height = rect.height;
            
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y + height);
        });
        
        // Añadir espacio adicional
        const padding = 100;
        organigramaEl.style.width = `${maxX + padding}px`;
        organigramaEl.style.height = `${maxY + padding}px`;
        
        // Ajustar posiciones si es necesario
        if (minX < 0 || minY < 0) {
            const offsetX = minX < 0 ? Math.abs(minX) + padding : 0;
            const offsetY = minY < 0 ? Math.abs(minY) + padding : 0;
            
            // Ajustar posiciones de nodos
            document.querySelectorAll('.nodo').forEach(nodo => {
                const x = parseInt(nodo.style.left) + offsetX;
                const y = parseInt(nodo.style.top) + offsetY;
                nodo.style.left = `${x}px`;
                nodo.style.top = `${y}px`;
                
                // Actualizar posición en los datos
                const nodoId = parseInt(nodo.getAttribute('data-id'));
                const nodoData = nodos.find(n => n.id === nodoId);
                if (nodoData) {
                    nodoData.posicion_x = x;
                    nodoData.posicion_y = y;
                }
            });
            
            // Redibujar conexiones
            organigramaEl.querySelectorAll('.conexion').forEach(conn => conn.remove());
            dibujarConexiones();
        }
    }

    // Cargar nodos existentes desde la API
    // Cargar nodos existentes
    function cargarNodos() {
      fetch('/api/nodos')
          .then(response => response.json())
          .then(data => {
              nodos = data;
              // Calcular posiciones para todos los nodos
              calcularPosiciones(nodos);
              // Dibujar el organigrama
              dibujarOrganigrama();
          })
          .catch(error => console.error('Error al cargar nodos:', error));
    }

    // Función para calcular la disposición óptima de los nodos
    function calcularDisposicionOptima() {
        const raiz = nodos.find(n => n.nivel_jerarquico === 1);
        if (!raiz) return;

        // Posicionar el nodo raíz en el centro superior
        raiz.posicion_x = (organigramaEl.clientWidth / 2) - (config.nodoAncho / 2);
        raiz.posicion_y = 20;

        // Agrupar nodos por nivel jerárquico
        const nodosNivelados = agruparNodosPorNivel();

        // Calcular posiciones para cada nivel, comenzando desde el nivel 2
        Object.keys(nodosNivelados)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .forEach(nivel => {
                if (nivel === '1') return; // Saltar el nivel 1 (raíz)
                const nodosNivel = nodosNivelados[nivel];
                calcularPosicionesNivel(nodosNivel, nodosNivelados);
            });

        // Actualizar posiciones en la base de datos
        const promesas = nodos.map(nodo =>
            fetch(`/api/nodos/${nodo.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    posicion_x: nodo.posicion_x,
                    posicion_y: nodo.posicion_y
                })
            })
        );

        return Promise.all(promesas);
    }

    // Función para agrupar nodos por nivel jerárquico
    function agruparNodosPorNivel() {
        const nodosPorNivel = {};
        nodos.forEach(nodo => {
            const nivel = nodo.nivel_jerarquico;
            if (!nodosPorNivel[nivel]) {
                nodosPorNivel[nivel] = [];
            }
            nodosPorNivel[nivel].push(nodo);
        });
        return nodosPorNivel;
    }

    // Calcular posiciones para un nivel específico
    function calcularPosicionesNivel(nodosNivel, nodosNivelados) {
        nodosNivel.forEach(nodo => {
          const padre = nodos.find(n => n.id === nodo.padre_id);
          if (!padre) return;
      
          // Encontrar todos los hijos del mismo padre en este nivel
          const hermanos = nodosNivel.filter(n => n.padre_id === padre.id);
          const indiceHermano = hermanos.indexOf(nodo);
          const totalHermanos = hermanos.length;
      
          // Calcular la posición Y basada en el nivel
          nodo.posicion_y = padre.posicion_y + config.margenVertical;
      
          // Aplicar lógica de posicionamiento para todos los niveles
          if (totalHermanos === 1) {
            // Si es hijo único, se posiciona centrado respecto al padre
            nodo.posicion_x = padre.posicion_x + (config.nodoAncho / 2) - (config.nodoAncho / 2);
          } else {
            // Si hay múltiples hermanos, calcular distribución simétrica
            const anchoTotal = totalHermanos * config.nodoAncho + (totalHermanos - 1) * config.margenHorizontal;
            const inicioX = padre.posicion_x + (config.nodoAncho / 2) - (anchoTotal / 2);
            nodo.posicion_x = inicioX + indiceHermano * (config.nodoAncho + config.margenHorizontal);
          }
        });
      
        // Verificar y ajustar superposiciones
        for (let i = 0; i < nodosNivel.length; i++) {
          for (let j = i + 1; j < nodosNivel.length; j++) {
            if (nodosNivel[i].posicion_x < nodosNivel[j].posicion_x + config.nodoAncho &&
                nodosNivel[i].posicion_x + config.nodoAncho > nodosNivel[j].posicion_x &&
                nodosNivel[i].posicion_y < nodosNivel[j].posicion_y + config.nodoAlto &&
                nodosNivel[i].posicion_y + config.nodoAlto > nodosNivel[j].posicion_y) {
              // Ajustar la posición del nodo j para evitar superposición
              nodosNivel[j].posicion_x += config.nodoAncho + config.margenHorizontal;
            }
          }
        }
    }

    // Función para calcular posiciones de nodos con distribución avanzada
    function calcularPosiciones(nodos) {
      // Configuración de dimensiones
      const ANCHO_NODO = 150;
      const ALTO_NODO = 80;
      const ESPACIO_VERTICAL = 100;
      const ESPACIO_HORIZONTAL_MIN = 50;
      
      // Encontrar el nodo raíz (nivel 1)
      const nodoRaiz = nodos.find(n => n.nivel_jerarquico === 1);
      if (!nodoRaiz) return;
      
      // Organizar nodos en una estructura jerárquica
      const nodosMap = new Map(nodos.map(n => [n.id, { ...n, hijos: [] }]));
      
      // Construir la jerarquía
      nodos.forEach(nodo => {
          if (nodo.padre_id && nodosMap.has(nodo.padre_id)) {
              nodosMap.get(nodo.padre_id).hijos.push(nodosMap.get(nodo.id));
          }
      });
      
      // Cálculo del ancho necesario para cada subárbol
      function calcularAnchoSubarbol(nodo) {
          if (nodo.hijos.length === 0) {
              nodo.anchoSubarbol = ANCHO_NODO + ESPACIO_HORIZONTAL_MIN;
              return nodo.anchoSubarbol;
          }
          
          // Calcular el ancho de cada subárbol hijo
          let anchoTotal = 0;
          nodo.hijos.forEach(hijo => {
              anchoTotal += calcularAnchoSubarbol(hijo);
          });
          
          // Para nodos del nivel 2 con más de 3 hijos, añadir espacio extra
          if (nodo.nivel_jerarquico === 2 && nodo.hijos.length > 3) {
              anchoTotal += (nodo.hijos.length - 3) * ESPACIO_HORIZONTAL_MIN * 2;
          }
          
          // El ancho mínimo debe ser al menos el ancho del nodo
          nodo.anchoSubarbol = Math.max(anchoTotal, ANCHO_NODO + ESPACIO_HORIZONTAL_MIN);
          return nodo.anchoSubarbol;
      }
      
      // Calcular el ancho total necesario para el árbol
      const anchoTotal = calcularAnchoSubarbol(nodosMap.get(nodoRaiz.id));
      
      // Posicionar nodo raíz centrado en la parte superior
      const raizNode = nodosMap.get(nodoRaiz.id);
      raizNode.posicion_x = (organigramaEl.clientWidth - ANCHO_NODO) / 2;
      raizNode.posicion_y = 20;
      
      // Función recursiva para asignar posiciones
      function asignarPosiciones(nodo, offsetX, totalWidth) {
          // Ajustar el offset si el ancho disponible es mayor que el necesario
          if (totalWidth > nodo.anchoSubarbol) {
              offsetX += (totalWidth - nodo.anchoSubarbol) / 2;
          }
          
          // Si no tiene hijos, no hay más que hacer
          if (nodo.hijos.length === 0) {
              return;
          }
          
          let currentOffset = offsetX;
          
          // Tratamiento especial para nodos de nivel 2 con muchos hijos
          const espacioExtra = nodo.nivel_jerarquico === 2 && nodo.hijos.length > 3 
              ? (nodo.hijos.length - 3) * ESPACIO_HORIZONTAL_MIN * 0.5 
              : 0;
              
          // Distribuir hijos
          nodo.hijos.forEach(hijo => {
              hijo.posicion_x = currentOffset + (hijo.anchoSubarbol - ANCHO_NODO) / 2;
              hijo.posicion_y = nodo.posicion_y + ALTO_NODO + ESPACIO_VERTICAL;
              
              // Recursivamente posicionar los hijos
              asignarPosiciones(hijo, currentOffset, hijo.anchoSubarbol);
              
              // Avanzar el offset para el siguiente hijo
              currentOffset += hijo.anchoSubarbol + espacioExtra;
          });
          
          // Si se desplazaron los hijos debido al espacio extra, centrar al padre
          if (nodo.hijos.length > 0) {
              const primerHijo = nodo.hijos[0];
              const ultimoHijo = nodo.hijos[nodo.hijos.length - 1];
              const centroHijos = (primerHijo.posicion_x + ultimoHijo.posicion_x + ANCHO_NODO) / 2;
              
              // Recentrar al padre sobre sus hijos
              if (Math.abs(nodo.posicion_x + ANCHO_NODO/2 - centroHijos) > 1) {
                  nodo.posicion_x = centroHijos - ANCHO_NODO/2;
              }
          }
      }
      
      // Comenzar la asignación de posiciones para todo el árbol
      asignarPosiciones(raizNode, 0, Math.max(anchoTotal, organigramaEl.clientWidth));
      
      // Convertir la estructura jerárquica modificada de vuelta a la lista plana
      const nodosActualizados = [];
      function aplanarNodos(nodo) {
          nodosActualizados.push({
              id: nodo.id,
              posicion_x: nodo.posicion_x,
              posicion_y: nodo.posicion_y
          });
          nodo.hijos.forEach(hijo => aplanarNodos(hijo));
      }
      aplanarNodos(raizNode);
      
      // Actualizar posiciones en la base de datos
      nodosActualizados.forEach(nodo => {
          fetch(`/api/nodos/${nodo.id}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  posicion_x: nodo.posicion_x,
                  posicion_y: nodo.posicion_y
              })
          }).catch(error => console.error('Error al actualizar posición:', error));
      });
      
      // Actualizar objetos originales con las nuevas posiciones
      nodosActualizados.forEach(nodoAct => {
          const nodo = nodos.find(n => n.id === nodoAct.id);
          if (nodo) {
              nodo.posicion_x = nodoAct.posicion_x;
              nodo.posicion_y = nodoAct.posicion_y;
          }
      });
    }
      

    // Llamar a la función después de cargar o modificar el organigrama
    function dibujarOrganigrama() {
        // Limpiar el contenedor
        organigramaEl.innerHTML = '';
        
        // Primero dibujar las conexiones
        dibujarConexiones();
        
        // Luego dibujar los nodos
        nodos.forEach(nodo => {
            dibujarNodo(nodo);
        });
        
        // Ajustar tamaño
        adjustOrganigramaSize();
    }

    // Dibujar un nodo individual
    function dibujarNodo(nodo) {
        const nodoEl = document.createElement('div');
        nodoEl.className = `nodo nivel-${nodo.nivel_jerarquico}`;
        nodoEl.setAttribute('data-id', nodo.id);
        nodoEl.style.left = `${nodo.posicion_x}px`;
        nodoEl.style.top = `${nodo.posicion_y}px`;
        nodoEl.style.width = `${config.nodoAncho}px`;
        nodoEl.style.height = `${config.nodoAlto}px`;
        nodoEl.innerHTML = `
          <div class="nodo-header">${nodo.nombre}</div>
          <div class="nodo-body">${nodo.cargo === 'directo' ? 'Cargo Directo' : 'Asesoría'}</div>
        `;
        nodoEl.addEventListener('click', function (e) {
          e.stopPropagation();
          if (!dragging) {
            seleccionarNodo(nodo.id);
          }
        });
        nodoEl.addEventListener('mouseover', function (e) {
          if (!dragging) {
            mostrarOpcionesNodo(e, nodo);
          }
        });
        nodoEl.addEventListener('mouseout', function (e) {
          if (!dragging) {
            setTimeout(() => {
              const opcionesEl = document.getElementById('opciones-nodo');
              if (opcionesEl && !opcionesEl.matches(':hover')) {
                ocultarOpcionesNodo();
              }
            }, 100);
          }
        });
        habilitarArrastre(nodoEl, nodo);
        organigramaEl.appendChild(nodoEl);
    }

    // Dibujar conexiones entre nodos
    function dibujarConexiones() {
        // Agregar estilos primero
        agregarEstilosConexiones();
        
        // Eliminar conexiones existentes
        organigramaEl.querySelectorAll('.conexion').forEach(conn => conn.remove());
        
        // Primero dibujar las conexiones directas
        nodos.forEach(nodo => {
          if (nodo.padre_id && nodo.cargo === 'directo') {
            const padre = nodos.find(n => n.id === nodo.padre_id);
            if (padre) {
              crearConexion(padre, nodo);
            }
          }
        });
        
        // Luego dibujar las conexiones de asesoría para que sean visibles por encima
        nodos.forEach(nodo => {
          if (nodo.padre_id && nodo.cargo === 'asesoria') {
            const padre = nodos.find(n => n.id === nodo.padre_id);
            if (padre) {
              crearConexion(padre, nodo);
            }
          }
        });
    }

    // Crear una conexión visual entre dos nodos
    function crearConexion(nodoPadre, nodoHijo) {
        const tipoLinea = nodoHijo.cargo === 'directo' ? 'conexion-directa' : 'conexion-asesoria';
        
        // Puntos de origen (centro inferior del padre)
        const xPadre = nodoPadre.posicion_x + (config.nodoAncho / 2);
        const yPadre = nodoPadre.posicion_y + config.nodoAlto;
        
        // Puntos de destino (centro superior del hijo)
        const xHijo = nodoHijo.posicion_x + (config.nodoAncho / 2);
        const yHijo = nodoHijo.posicion_y;
        
        // Punto intermedio a la mitad del camino vertical
        const yMedio = yPadre + (yHijo - yPadre) / 2;
        
        // 1. Línea vertical desde el padre hasta el punto medio
        const lineaVertical1 = document.createElement('div');
        lineaVertical1.className = `conexion ${tipoLinea} vertical`;
        lineaVertical1.style.width = '2px';
        lineaVertical1.style.height = `${(yHijo - yPadre) / 2}px`;
        lineaVertical1.style.left = `${xPadre}px`;
        lineaVertical1.style.top = `${yPadre}px`;
        
        // Si es de asesoría, aplicar estilo de línea discontinua
        if (tipoLinea === 'conexion-asesoria') {
          lineaVertical1.style.borderLeft = 'none';
          lineaVertical1.style.borderRight = '2px dashed #666';
          lineaVertical1.style.backgroundColor = 'transparent';
        }
        
        organigramaEl.appendChild(lineaVertical1);
        
        // 2. Línea horizontal desde el punto medio hasta la posición del hijo
        const lineaHorizontal = document.createElement('div');
        lineaHorizontal.className = `conexion ${tipoLinea} horizontal`;
        lineaHorizontal.style.height = '2px';
        lineaHorizontal.style.top = `${yMedio}px`;
        
        // Determinar dirección y ancho de la línea horizontal
        if (xHijo > xPadre) {
          lineaHorizontal.style.left = `${xPadre}px`;
          lineaHorizontal.style.width = `${xHijo - xPadre}px`;
        } else {
          lineaHorizontal.style.left = `${xHijo}px`;
          lineaHorizontal.style.width = `${xPadre - xHijo}px`;
        }
        
        // Si es de asesoría, aplicar estilo de línea discontinua
        if (tipoLinea === 'conexion-asesoria') {
          lineaHorizontal.style.borderBottom = 'none';
          lineaHorizontal.style.borderTop = '2px dashed #666';
          lineaHorizontal.style.backgroundColor = 'transparent';
        }
        
        organigramaEl.appendChild(lineaHorizontal);
        
        // 3. Línea vertical desde el punto medio hasta el hijo
        const lineaVertical2 = document.createElement('div');
        lineaVertical2.className = `conexion ${tipoLinea} vertical`;
        lineaVertical2.style.width = '2px';
        lineaVertical2.style.height = `${(yHijo - yPadre) / 2}px`;
        lineaVertical2.style.left = `${xHijo}px`;
        lineaVertical2.style.top = `${yMedio}px`;
        
        // Si es de asesoría, aplicar estilo de línea discontinua
        if (tipoLinea === 'conexion-asesoria') {
          lineaVertical2.style.borderLeft = 'none';
          lineaVertical2.style.borderRight = '2px dashed #666';
          lineaVertical2.style.backgroundColor = 'transparent';
        }
        
        organigramaEl.appendChild(lineaVertical2);
    }
    
    // Actualiza el CSS para los estilos de las conexiones
    function agregarEstilosConexiones() {
        // Verificar si ya existe el estilo
        if (!document.getElementById('estilos-conexiones')) {
          const estilos = document.createElement('style');
          estilos.id = 'estilos-conexiones';
          estilos.textContent = `
            .conexion {
              position: absolute;
              pointer-events: none;
              z-index: 1;
            }
            .conexion-directa {
              background-color: #333;
            }
            .conexion-asesoria {
              background-color: transparent;
            }
            .conexion.vertical.conexion-asesoria {
              border-right: 2px dashed #666;
              border-left: none;
            }
            .conexion.horizontal.conexion-asesoria {
              border-top: 2px dashed #666;
              border-bottom: none;
            }
          `;
          document.head.appendChild(estilos);
        }
    }

    // Mostrar opciones al pasar el mouse sobre un nodo
    function mostrarOpcionesNodo(event, nodo) {
    ocultarOpcionesNodo(); // Ocultar cualquier cuadro de opciones existente
  
    const opcionesEl = document.createElement('div');
    opcionesEl.className = 'nodo-opciones';
    opcionesEl.id = 'opciones-nodo';
    const rect = event.target.closest('.nodo').getBoundingClientRect();
    const organigramaRect = organigramaEl.getBoundingClientRect();
    opcionesEl.style.left = `${rect.left - organigramaRect.left + rect.width}px`;
    opcionesEl.style.top = `${rect.top - organigramaRect.top}px`;
  
    const btnSubordinado = document.createElement('button');
    btnSubordinado.className = 'opcion-btn';
    btnSubordinado.textContent = 'Agregar subordinado directo';
    btnSubordinado.addEventListener('click', function (e) {
      e.stopPropagation();
      agregarNuevoNodo(nodo.id, 'directo', nodo.nivel_jerarquico + 1);
      ocultarOpcionesNodo();
    });
    opcionesEl.appendChild(btnSubordinado);
  
    const btnAsesor = document.createElement('button');
    btnAsesor.className = 'opcion-btn';
    btnAsesor.textContent = 'Agregar asesor';
    btnAsesor.addEventListener('click', function (e) {
      e.stopPropagation();
      agregarNuevoNodo(nodo.id, 'asesoria', nodo.nivel_jerarquico + 1);
      ocultarOpcionesNodo();
    });
    opcionesEl.appendChild(btnAsesor);
  
    const btnEditar = document.createElement('button');
    btnEditar.className = 'opcion-btn';
    btnEditar.textContent = 'Editar nodo';
    btnEditar.addEventListener('click', function (e) {
      e.stopPropagation();
      seleccionarNodo(nodo.id);
      ocultarOpcionesNodo();
    });
    opcionesEl.appendChild(btnEditar);
  
    const btnEliminarNodo = document.createElement('button');
    btnEliminarNodo.className = 'opcion-btn opcion-eliminar';
    btnEliminarNodo.textContent = 'Eliminar nodo';
    btnEliminarNodo.addEventListener('click', function (e) {
      e.stopPropagation();
      eliminarNodo(nodo.id);
      ocultarOpcionesNodo();
    });
    opcionesEl.appendChild(btnEliminarNodo);
  
    opcionesEl.addEventListener('mouseover', function () {
      clearTimeout(window.ocultarOpcionesTimeout);
    });
    opcionesEl.addEventListener('mouseout', function () {
      ocultarOpcionesNodoConRetraso();
    });
  
    organigramaEl.appendChild(opcionesEl);
  }

    // Ocultar opciones cuando el mouse sale del nodo
    function ocultarOpcionesNodoConRetraso() {
        clearTimeout(window.ocultarOpcionesTimeout);
        window.ocultarOpcionesTimeout = setTimeout(() => {
          const opcionesEl = document.getElementById('opciones-nodo');
          if (opcionesEl) {
            opcionesEl.remove();
          }
        }, 2000); // Desaparece después de 2 segundos
      }

    // Seleccionar un nodo para edición
    function seleccionarNodo(nodoId) {
        nodoSeleccionado = nodos.find(n => n.id === nodoId);
        if (nodoSeleccionado) {
            inputNodoId.value = nodoSeleccionado.id;
            inputNombreNodo.value = nodoSeleccionado.nombre;
            selectCargoNodo.value = nodoSeleccionado.cargo;
            formEdicion.classList.remove('hidden');

            document.querySelectorAll('.nodo').forEach(n => n.classList.remove('seleccionado'));
            document.querySelector(`.nodo[data-id="${nodoId}"]`).classList.add('seleccionado');
        }
    }

    // Ocultar opciones inmediatamente
    function ocultarOpcionesNodo() {
    clearTimeout(window.ocultarOpcionesTimeout);
    const opcionesEl = document.getElementById('opciones-nodo');
    if (opcionesEl) {
      opcionesEl.remove();
    }
    }

    // Agregar nuevo nodo
    function agregarNuevoNodo(padreId, cargo, nivel) {
      const padre = padreId ? nodos.find(n => n.id === padreId) : null;
      
      // Verificar restricciones
      if (nivel > 7) {
          alert("No se pueden agregar más niveles. El máximo es 7.");
          return;
      }
      
      if (padre && nivel >= 3) {
          // Contar hijos actuales
          const hijosActuales = nodos.filter(n => n.padre_id === padreId).length;
          if (hijosActuales >= 5) {
              alert("No se pueden agregar más de 5 hijos a este nodo.");
              return;
          }
      }
      
      // Calcular posición para el nuevo nodo (temporal)
      let posX = 0;
      let posY = 0;
      
      if (padre) {
          // Si hay padre, colocar debajo del padre inicialmente
          posX = padre.posicion_x;
          posY = padre.posicion_y + 100;
      } else {
          // Si es nodo principal, colocar en el centro arriba
          posX = organigramaEl.clientWidth / 2 - 75;
          posY = 20;
      }
      
      // Crear el nuevo nodo en la base de datos
      const nuevoNodo = {
          nombre: 'Nuevo nodo',
          cargo: cargo,
          nivel_jerarquico: nivel,
          padre_id: padreId,
          posicion_x: posX,
          posicion_y: posY
      };
      
      fetch('/api/nodos', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(nuevoNodo)
      })
      .then(response => response.json())
      .then(data => {
          cargarNodos(); // Recargar todos los nodos y recalcular posiciones
          seleccionarNodo(data.id); // Seleccionar el nuevo nodo para edición
      })
      .catch(error => console.error('Error al crear nodo:', error));
    }

    // Eliminar nodo y sus subordinados
    function eliminarNodo(nodoId) {
        const nodo = nodos.find(n => n.id === nodoId);
        if (!nodo) return;

        if (nodo.nivel_jerarquico === 1 && nodos.filter(n => n.nivel_jerarquico === 1).length === 1) {
            if (!confirm('¿Está seguro que desea eliminar el nodo principal? Esto eliminará todo el organigrama.')) {
                return;
            }
        } else {
            if (!confirm('¿Está seguro que desea eliminar este nodo y todos sus subordinados?')) {
                return;
            }
        }

        const nodosAEliminar = obtenerNodosSubordinados(nodoId);
        nodosAEliminar.push(nodoId);

        const promesas = nodosAEliminar.map(id =>
            fetch(`/api/nodos/${id}`, {
                method: 'DELETE'
            })
        );

        Promise.all(promesas)
            .then(() => {
                if (nodoSeleccionado && nodosAEliminar.includes(nodoSeleccionado.id)) {
                    formEdicion.classList.add('hidden');
                    nodoSeleccionado = null;
                }
                cargarNodos();
            })
            .catch(error => console.error('Error al eliminar nodos:', error));
    }

    // Obtener todos los IDs de nodos subordinados de forma recursiva
    function obtenerNodosSubordinados(nodoId) {
        const subordinados = [];
        const hijos = nodos.filter(n => n.padre_id === nodoId).map(n => n.id);
        subordinados.push(...hijos);
        hijos.forEach(hijoId => {
            const subSubordinados = obtenerNodosSubordinados(hijoId);
            subordinados.push(...subSubordinados);
        });
        return subordinados;
    }

    // Habilitar arrastre de nodos
    function habilitarArrastre(nodoEl, nodo) {
        let offsetX, offsetY;
        dragging = false;

        nodoEl.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;

            e.preventDefault();
            e.stopPropagation();

            const rect = nodoEl.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            document.addEventListener('mousemove', moverNodo);
            document.addEventListener('mouseup', soltarNodo);

            nodoEl.classList.add('nodo-arrastrando');
            dragging = false;
        });

        function moverNodo(e) {
            dragging = true;

            const organigramaRect = organigramaEl.getBoundingClientRect();
            const nuevaX = (e.clientX - organigramaRect.left - offsetX) / config.escala;
            const nuevaY = (e.clientY - organigramaRect.top - offsetY) / config.escala;

            const posX = Math.max(0, nuevaX);
            const posY = Math.max(0, nuevaY);

            nodoEl.style.left = `${posX}px`;
            nodoEl.style.top = `${posY}px`;

            nodo.posicion_x = posX;
            nodo.posicion_y = posY;

            actualizarConexionesEnTiempoReal(nodo);
        }

        function soltarNodo() {
            document.removeEventListener('mousemove', moverNodo);
            document.removeEventListener('mouseup', soltarNodo);
            nodoEl.classList.remove('nodo-arrastrando');

            if (dragging) {
                fetch(`/api/nodos/${nodo.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        posicion_x: nodo.posicion_x,
                        posicion_y: nodo.posicion_y
                    })
                })
                    .then(() => {
                        if (tieneHijos(nodo.id)) {
                            calcularDisposicionOptima().then(() => {
                                dibujarOrganigrama();
                            });
                        } else {
                            organigramaEl.querySelectorAll('.conexion').forEach(conn => conn.remove());
                            dibujarConexiones();
                        }
                    })
                    .catch(error => console.error('Error al actualizar posición:', error));
            }
        }
    }

    // Verificar si un nodo tiene hijos
    function tieneHijos(nodoId) {
        return nodos.some(n => n.padre_id === nodoId);
    }

    // Actualizar conexiones en tiempo real durante el arrastre
    // Función actualizada para actualizar conexiones en tiempo real durante el arrastre
    function actualizarConexionesEnTiempoReal(nodoModificado) {
        organigramaEl.querySelectorAll('.conexion').forEach(conn => conn.remove());
        dibujarConexiones(); // Usar la nueva función dibujarConexiones que respeta el orden
    }

    // Eventos de botones
    btnCrearPrincipal.addEventListener('click', function () {
        const existe = nodos.some(n => n.nivel_jerarquico === 1);
        if (!existe) {
            agregarNuevoNodo(null, 'directo', 1);
        } else {
            alert('Ya existe un nodo principal. Solo puede haber uno.');
        }
    });

    btnGuardar.addEventListener('click', function () {
        if (!nodoSeleccionado) return;
    
        const nuevoNombre = inputNombreNodo.value.trim();
        const nuevoCargo = selectCargoNodo.value;
    
        if (!nuevoNombre) {
            alert('El nombre del nodo no puede estar vacío');
            return;
        }
    
        fetch(`/api/nodos/${nodoSeleccionado.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nuevoNombre,
                cargo: nuevoCargo
            })
        })
        .then(() => {
            nodoSeleccionado.nombre = nuevoNombre;
            nodoSeleccionado.cargo = nuevoCargo;
            dibujarOrganigrama();
            formEdicion.classList.add('hidden');
            nodoSeleccionado = null;
        })
        .catch(error => console.error('Error al actualizar nodo:', error));
    });
    
    btnCancelar.addEventListener('click', function () {
        formEdicion.classList.add('hidden');
        nodoSeleccionado = null;
        document.querySelectorAll('.nodo').forEach(n => n.classList.remove('seleccionado'));
    });
    
    btnEliminar.addEventListener('click', function () {
        if (!nodoSeleccionado) return;
        eliminarNodo(nodoSeleccionado.id);
    });
    
    // Manejo de eventos de teclado
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && formEdicion.classList.contains('hidden') === false) {
            btnCancelar.click();
        }
    });
    
    // Cancelar selección al hacer clic en el fondo
    organigramaEl.addEventListener('click', function (e) {
        if (e.target === organigramaEl) {
            btnCancelar.click();
        }
    });
    
    // Configurar eventos de botones de zoom
    if (btnZoomIn) btnZoomIn.addEventListener('click', () => applyZoom(currentZoom + zoomStep));
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => applyZoom(currentZoom - zoomStep));
    if (btnZoomReset) btnZoomReset.addEventListener('click', () => applyZoom(1));
    if (btnPrint) btnPrint.addEventListener('click', printOrganigrama);
    
    // Agregar soporte para zoom con rueda del mouse
    if (organigramaViewport) {
        organigramaViewport.addEventListener('wheel', function(e) {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
                applyZoom(currentZoom + delta);
            }
        });
    }

    // Inicializar
    inicializarControlesZoom();
    cargarNodos();


});