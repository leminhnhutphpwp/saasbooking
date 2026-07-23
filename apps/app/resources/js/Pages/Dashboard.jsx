import { useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';

export default function Dashboard() {
    const { auth } = usePage().props;

    useEffect(() => {
        if (auth.user?.tenant_id) {
            router.replace(route('manager.home'));
        }
    }, []);

    return null;
}
