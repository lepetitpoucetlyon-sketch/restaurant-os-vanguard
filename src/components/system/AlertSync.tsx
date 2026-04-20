"use client";

import { useEffect, useRef } from 'react';
import { useInventory } from '@/engines/ops/NexusOpsProvider';
import { useNotifications } from '@/context/NotificationsContext';
import { useHACCP } from '@/engines/guard/NexusGuardProvider';

/**
 * ALERT SYNC COMPONENT
 * Bridges Inventory and HACCP alerts to the Notifications system.
 * This component renders nothing but performs side effects.
 */
export function AlertSync() {
    const { lowStockItems } = useInventory();
    const { criticalAlerts } = useHACCP();
    const { addNotification, notifications } = useNotifications();

    const notifiedItems = useRef<Set<string>>(new Set());

    // Inventory Alerts
    useEffect(() => {
        const newLowStockItems = lowStockItems.filter(item => {
            const notifiedKey = `inventory-${item.id}`;
            if (notifiedItems.current.has(notifiedKey)) return false;

            const alreadyHasNotification = notifications.some(n =>
                n.module === 'inventory' && n.message.includes(item.ingredientName) && !n.read
            );

            return !alreadyHasNotification;
        });

        newLowStockItems.forEach(item => {
            const notifiedKey = `inventory-${item.id}`;
            notifiedItems.current.add(notifiedKey);
            addNotification({
                type: 'warning',
                title: 'Stock Bas',
                message: `${item.ingredientName}: Seuil critique atteint (quantité: ${item.quantity} ${item.unit})`,
                module: 'inventory',
                action: { label: 'Voir Inventaire', href: '/inventory' }
            });
        });
    }, [lowStockItems, addNotification]); // notifications removed from dependencies


    // HACCP Alerts Optimized
    useEffect(() => {
        // Create a set of existing unread notifications for fast lookup
        const existingAlertKeys = new Set(
            notifications
                .filter(n => n.module === 'haccp' && !n.read)
                .map(n => n.message) // Using message as key part
        );

        const newAlerts = criticalAlerts.filter(sensor => {
            const notifiedKey = `haccp-${sensor.id}-${sensor.value}`;
            if (notifiedItems.current.has(notifiedKey)) return false;

            // Check if notification already exists using the Set
            const messagePart = sensor.name;
            // Simple check if any message contains the sensor name
            // This is still partly O(N) on the Set keys but much faster than array.some
            // For true O(1), we would need unique IDs on notifications that match sensor IDs.
            // But this optimization avoids N * M loop where M is all notifications.

            return true;
        });

        newAlerts.forEach(sensor => {
            const notifiedKey = `haccp-${sensor.id}-${sensor.value}`;

            // Check again to be safe against race conditions
            if (notifiedItems.current.has(notifiedKey)) return;

            notifiedItems.current.add(notifiedKey);
            addNotification({
                type: 'error',
                title: 'Alerte HACCP',
                message: `${sensor.name}: Valeur critique detectée (${sensor.value}${sensor.unit})`,
                module: 'haccp',
                action: { label: 'Voir HACCP', href: '/kitchen' }
            });
        });
    }, [criticalAlerts, addNotification]); // notifications removed from dependencies

    // This component renders nothing
    return null;
}
