import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react'

export default function LoadingComponent() {
    let [isOpen, setIsOpen] = useState(true)

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-10"
                onClose={() => setIsOpen(true)}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 backdrop-blur-sm bg-[#07211f]/30" />
                </Transition.Child>

                <div className="overflow-y-auto fixed inset-0">
                    <div className="flex justify-center items-center p-4 min-h-full text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="flex flex-col gap-4 items-center px-10 py-8 card" style={{ boxShadow: "var(--card-shadow-lg)" }}>
                                <div className="relative w-12 h-12">
                                    <div className="absolute inset-0 rounded-full border-4 border-teal-100" />
                                    <div className="absolute inset-0 rounded-full border-4 border-teal-600 animate-spin border-t-transparent" />
                                </div>
                                <div className="text-sm font-semibold text-gray-600">กำลังโหลด...</div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
