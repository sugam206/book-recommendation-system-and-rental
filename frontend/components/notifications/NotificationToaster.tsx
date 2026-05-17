'use client';

import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/reduxToolkit/store';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

type NotificationItem = {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
};

export default function NotificationToaster() {
    const { token } = useSelector((state: RootState) => state.auth);
    const shownIds = useRef<Set<string>>(new Set());
    const isLoadingRef = useRef(false);

    useEffect(() => {
        if (!token) {
            shownIds.current.clear();
            return;
        }

        let isMounted = true;

        const loadNotifications = async () => {
            if (isLoadingRef.current) return; // Prevent concurrent requests
            isLoadingRef.current = true;

            try {
                const response = await axios.get(
                    `${API_BASE}/api/notifications?unreadOnly=true&limit=1`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                const notifications: NotificationItem[] = response.data?.notifications || [];
                if (!isMounted || notifications.length === 0) return;

                const notification = notifications[0]; // Only take the most recent

                if (shownIds.current.has(notification._id)) return;
                shownIds.current.add(notification._id);

                const message = `${notification.title}: ${notification.message}`;
                if (notification.type === 'success') toast.success(message);
                else if (notification.type === 'warning') toast.warning(message);
                else if (notification.type === 'error') toast.error(message);
                else toast.info(message);

                // Mark as read after showing
                try {
                    await axios.patch(
                        `${API_BASE}/api/notifications/${notification._id}/read`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } catch {
                    // Silently fail if mark-as-read API fails
                }
            } catch {
                // Keep polling silent to avoid noisy UI
            } finally {
                isLoadingRef.current = false;
            }
        };

        loadNotifications();
        const interval = window.setInterval(loadNotifications, 10000); // Poll every 10 seconds

        return () => {
            isMounted = false;
            window.clearInterval(interval);
        };
    }, [token]);

    return <ToastContainer position="top-right" autoClose={4500} newestOnTop closeOnClick theme="colored" />;
}