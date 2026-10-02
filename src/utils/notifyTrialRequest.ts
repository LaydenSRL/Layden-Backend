const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';

type TrialRequestData = {
    nombre: string;
    email: string;
    numero: string;
};

// Avisa al equipo de Layden (por EmailJS) que alguien pidio una prueba. Nunca
// tira: la solicitud ya quedo guardada en SolicitudesPrueba y se ve en el
// Dashboard, asi que si el mail falla (o no esta configurado) solo se loguea.
export async function notifyTrialRequest(data: TrialRequestData): Promise<void> {
    const {
        EMAILJS_SERVICE_ID,
        EMAILJS_TRIAL_TEMPLATE_ID,
        EMAILJS_PUBLIC_KEY,
        EMAILJS_PRIVATE_KEY,
        APP_URL,
    } = process.env;

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TRIAL_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY) {
        console.warn('EmailJS no esta configurado: se guardo la solicitud pero no se mando el aviso por mail.');
        return;
    }

    try {
        const response = await fetch(EMAILJS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_TRIAL_TEMPLATE_ID,
                user_id: EMAILJS_PUBLIC_KEY,
                accessToken: EMAILJS_PRIVATE_KEY,
                template_params: {
                    nombre: data.nombre,
                    email: data.email,
                    numero: data.numero,
                    time: new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
                    panel_url: `${APP_URL || 'https://layden.com.ar'}/dashboard`,
                },
            }),
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            console.error('EmailJS rechazo el aviso de solicitud:', response.status, await response.text());
        }
    } catch (error) {
        console.error('No se pudo mandar el aviso de solicitud por EmailJS:', error);
    }
}
