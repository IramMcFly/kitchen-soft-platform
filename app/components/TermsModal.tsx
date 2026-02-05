import { AlertTriangle, Shield, Scale, Server, CloudOff, FileText, Download, X } from 'lucide-react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
}

export default function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="relative z-50">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">

                    {/* Modal Panel */}
                    <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-gray-200">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <AlertTriangle className="h-6 w-6 text-orange-600" aria-hidden="true" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-semibold leading-6 text-gray-900">
                                            Términos de Uso y Licencia
                                        </h3>
                                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 text-sm text-gray-500 space-y-4">

                                        {/* Sección Beta */}
                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                            <div className="flex">
                                                <div className="ml-3">
                                                    <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wide">
                                                        Software en Fase de Desarrollo
                                                    </h4>
                                                    <p className="mt-1 text-sm text-yellow-700">
                                                        Kitchen Soft se distribuye "tal cual" (as-is). Al descargar este software, usted reconoce que puede contener errores, cambios de funcionalidad sin previo aviso o inestabilidad ocasional.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 divide-y divide-gray-100">
                                            <section className="pt-2">
                                                <h4 className="flex items-center font-bold text-gray-900 mb-2">
                                                    <Scale className="w-4 h-4 mr-2 text-gray-500" />
                                                    1. Licencia de Uso Limitada
                                                </h4>
                                                <p>
                                                    Kitchen Soft otorga una licencia <strong>no exclusiva, intransferible y revocable</strong> para utilizar este software únicamente para la gestión operativa interna de su negocio gastronómico.
                                                    <br /><br />
                                                    <span className="text-red-600 font-semibold uppercase text-xs">Prohibiciones Estrictas:</span>
                                                    <br />
                                                    Está terminantemente prohibida la redistribución, venta, alquiler, sublicencia, ingeniería inversa, descompilación o modificación del código fuente de este software sin autorización expresa y por escrito de Iram McFly Studios.
                                                </p>
                                            </section>

                                            <section className="pt-4">
                                                <h4 className="flex items-center font-bold text-gray-900 mb-2">
                                                    <Shield className="w-4 h-4 mr-2 text-gray-500" />
                                                    2. Verificación y Seguridad DRM
                                                </h4>
                                                <p>
                                                    El sistema incorpora mecanismos de protección digital (DRM). Usted acepta que el software realice conexiones periódicas a nuestros servidores para verificar la validez de su licencia.
                                                    <br /><br />
                                                    Kitchen Soft se reserva el derecho de <strong>desactivar remotamente</strong> cualquier instancia del software si detecta:
                                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                                        <li>Uso fraudulento o piratería.</li>
                                                        <li>Alteración de los archivos del sistema.</li>
                                                        <li>Intentos de eludir la seguridad de la licencia.</li>
                                                        <li>Violación de estos términos de servicio.</li>
                                                    </ul>
                                                </p>
                                            </section>

                                            <section className="pt-4">
                                                <h4 className="flex items-center font-bold text-gray-900 mb-2">
                                                    <CloudOff className="w-4 h-4 mr-2 text-gray-500" />
                                                    3. Responsabilidad de Datos
                                                </h4>
                                                <p>
                                                    Al ser un sistema <strong>Local-First</strong> (Offline), la base de datos reside físicamente en su equipo.
                                                    <br />
                                                    <strong>Usted es el único responsable</strong> de realizar copias de seguridad (backups) periódicas. Kitchen Soft no almacena copias de sus ventas ni inventarios en la nube y no se hace responsable por pérdida de datos derivada de fallos de hardware, virus, o mal uso del equipo.
                                                </p>
                                            </section>

                                            <section className="pt-4">
                                                <h4 className="flex items-center font-bold text-gray-900 mb-2">
                                                    <Server className="w-4 h-4 mr-2 text-gray-500" />
                                                    4. Modelo de Servicio (SaaS)
                                                </h4>
                                                <p>
                                                    Actualmente, Kitchen Soft opera bajo un modelo promocional. En el futuro, el servicio transicionará a un modelo de suscripción (Software as a Service).
                                                    <br />
                                                    Nos reservamos el derecho de modificar las tarifas, planes y características disponibles en futuras versiones. Los usuarios actuales serán notificados con antelación sobre cualquier transición de precios.
                                                </p>
                                            </section>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                            <button
                                type="button"
                                className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 sm:ml-3 sm:w-auto items-center"
                                onClick={onAccept}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Aceptar y Descargar
                            </button>
                            <button
                                type="button"
                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                onClick={onClose}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
