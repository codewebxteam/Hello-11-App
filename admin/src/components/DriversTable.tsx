import React from 'react';

const DriversTable: React.FC = () => {
    const drivers = [
        { id: 1, name: 'Michael Knight', vehicle: 'Black Pontiac Firebird', plate: 'KITT', rating: 5.0, status: 'Active' },
        { id: 2, name: 'Dominic Toretto', vehicle: '1970 Dodge Charger', plate: 'TORETTO', rating: 4.8, status: 'Active' },
        { id: 3, name: 'Baby', vehicle: 'Subaru Impreza WRX', plate: 'BABY', rating: 4.5, status: 'Busy' },
        { id: 4, name: 'Max Rockatansky', vehicle: 'V8 Interceptor', plate: 'MADMAX', rating: 4.9, status: 'Offline' },
        { id: 5, name: 'Speed Racer', vehicle: 'Mach 5', plate: 'MACH5', rating: 5.0, status: 'Active' },
    ];

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Registered Drivers</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {drivers.map((driver) => (
                        <tr key={driver.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">
                                            {driver.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{driver.vehicle}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded inline-block text-gray-600">{driver.plate}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-yellow-500 font-bold flex items-center">
                                    <span>★</span>
                                    <span className="ml-1 text-gray-700">{driver.rating}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${driver.status === 'Active' ? 'bg-green-100 text-green-800' :
                                        driver.status === 'Busy' ? 'bg-orange-100 text-orange-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {driver.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <a href="#" className="text-indigo-600 hover:text-indigo-900">Details</a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DriversTable;
