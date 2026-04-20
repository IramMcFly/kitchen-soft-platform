import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Terms() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos y Condiciones</h1>

                    <div className="prose text-gray-600">
                        <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">1. Aceptación de los Términos</h2>
                        <p>Al acceder y utilizar el software Kitchen Soft POS, aceptas estar sujeto a estos términos y condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar nuestro servicio.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">2. Licencia de Uso</h2>
                        <p>Se concede una licencia limitada, no exclusiva e intransferible para utilizar el software de acuerdo con el plan suscrito (FREE o PRO).</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">3. Restricciones</h2>
                        <p>No está permitido: modificar, descompilar o realizar ingeniería inversa del software; utilizar el software para fines ilegales; compartir tus credenciales de acceso con terceros.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">4. Planes y Pagos</h2>
                        <p>Los servicios pagados se facturan por adelantado de forma mensual. Kitchen Soft se reserva el derecho de cambiar las tarifas de los planes con previo aviso.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">5. Limitación de Responsabilidad</h2>
                        <p>Kitchen Soft no será responsable de daños indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad de usar el servicio.</p>

                        <p className="mt-8 text-sm text-gray-500">Última actualización: Febrero 2026</p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
