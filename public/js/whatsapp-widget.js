/**
 * H&M Multiservice - Botón Flotante Oficial de WhatsApp
 * Número: 1 (829) 348-8924
 */
(function() {
  if (document.getElementById('hym-whatsapp-floating-btn')) return;

  const PHONE = '18293488924';
  const DEFAULT_MESSAGE = encodeURIComponent('Hola H&M Multiservice, tengo una consulta sobre sus productos y servicios.');
  const WA_LINK = `https://wa.me/${PHONE}?text=${DEFAULT_MESSAGE}`;

  // Inject Styles
  const style = document.createElement('style');
  style.id = 'hym-wa-styles';
  style.textContent = `
    .hym-wa-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99990;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      font-family: 'Noto Sans', sans-serif;
    }

    .hym-wa-tooltip {
      background: #ffffff;
      color: #1e293b;
      padding: 10px 16px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid #e2e8f0;
      animation: hymWaFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      max-width: 250px;
      line-height: 1.3;
      position: relative;
    }

    .hym-wa-tooltip::after {
      content: '';
      position: absolute;
      bottom: -6px;
      right: 24px;
      width: 12px;
      height: 12px;
      background: #ffffff;
      transform: rotate(45deg);
      border-right: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }

    .hym-wa-tooltip-close {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 1.1rem;
      line-height: 1;
      padding: 0;
    }
    .hym-wa-tooltip-close:hover {
      color: #64748b;
    }

    .hym-wa-button {
      position: relative;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #25D366;
      box-shadow: 0 6px 20px rgba(37, 211, 102, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      border: none;
      outline: none;
    }

    .hym-wa-button:hover {
      transform: scale(1.08) translateY(-3px);
      box-shadow: 0 10px 26px rgba(37, 211, 102, 0.55);
    }

    .hym-wa-button svg {
      width: 34px;
      height: 34px;
      fill: #ffffff;
    }

    /* Pulse effect */
    .hym-wa-pulse {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: rgba(37, 211, 102, 0.4);
      z-index: -1;
      animation: hymWaPulse 2s infinite;
    }

    @keyframes hymWaPulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.25); opacity: 0; }
      100% { transform: scale(0.95); opacity: 0; }
    }

    @keyframes hymWaFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 640px) {
      .hym-wa-container {
        bottom: 18px;
        right: 18px;
      }
      .hym-wa-button {
        width: 54px;
        height: 54px;
      }
      .hym-wa-button svg {
        width: 30px;
        height: 30px;
      }
      .hym-wa-tooltip {
        display: none; /* Keep clean on small mobile screens */
      }
    }
  `;
  document.head.appendChild(style);

  // Inject HTML Elements
  const container = document.createElement('div');
  container.className = 'hym-wa-container';
  container.id = 'hym-whatsapp-floating-btn';

  container.innerHTML = `
    <div class="hym-wa-tooltip" id="hymWaTooltip" onclick="window.open('${WA_LINK}', '_blank')">
      <span>¿Dudas o pedidos? <strong>Chatea con nosotros</strong> 👋</span>
      <button class="hym-wa-tooltip-close" onclick="event.stopPropagation(); document.getElementById('hymWaTooltip').style.display='none';">&times;</button>
    </div>
    <a href="${WA_LINK}" target="_blank" rel="noopener noreferrer" class="hym-wa-button" title="Contactar por WhatsApp a H&M Multiservice">
      <div class="hym-wa-pulse"></div>
      <svg viewBox="0 0 448 512">
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
      </svg>
    </a>
  `;

  document.body.appendChild(container);
})();
