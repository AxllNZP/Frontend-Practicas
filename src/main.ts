import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

console.log('🚀 INICIANDO APLICACIÓN ANGULAR...');
console.log('📦 AppComponent:', AppComponent);
console.log('⚙️ appConfig:', appConfig);

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    console.log('✅ Aplicación iniciada correctamente');
  })
  .catch(err => {
    console.error('❌ ERROR CRÍTICO AL INICIAR:', err);
    console.error('Stack trace:', err.stack);
    
    // Mostrar error en la pantalla
    document.body.innerHTML = `
      <div style="padding: 20px; background: #fee; border: 2px solid #c33;">
        <h1 style="color: #c33;">❌ Error al cargar la aplicación</h1>
        <pre style="background: #fff; padding: 10px; overflow: auto;">
${err.message}

${err.stack}
        </pre>
      </div>
    `;
  });