"use client";

import { useState, useCallback } from "react";

interface UseDisclosureOptions {
    defaultIsOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
}

interface UseDisclosureReturn {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onToggle: () => void;
    setIsOpen: (value: boolean) => void;
}

/**
 * Hook pour gérer l'état ouvert/fermé de modals, drawers, dropdowns.
 * 
 * @example
 * const { isOpen, onOpen, onClose } = useDisclosure();
 * 
 * <Button onClick={onOpen}>Ouvrir</Button>
 * <Modal isOpen={isOpen} onClose={onClose}>...</Modal>
 */
export function useDisclosure(options: UseDisclosureOptions = {}): UseDisclosureReturn {
    const { defaultIsOpen = false, onOpen: onOpenCallback, onClose: onCloseCallback } = options;

    const [isOpen, setIsOpen] = useState(defaultIsOpen);

    const onOpen = useCallback(() => {
        setIsOpen(true);
        onOpenCallback?.();
    }, [onOpenCallback]);

    const onClose = useCallback(() => {
        setIsOpen(false);
        onCloseCallback?.();
    }, [onCloseCallback]);

    const onToggle = useCallback(() => {
        if (isOpen) {
            onClose();
        } else {
            onOpen();
        }
    }, [isOpen, onOpen, onClose]);

    return {
        isOpen,
        onOpen,
        onClose,
        onToggle,
        setIsOpen,
    };
}
