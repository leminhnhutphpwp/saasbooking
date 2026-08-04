import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function MotionReveal({ children, className = '', stagger = false }) {
    const element = useRef(null);

    useGSAP(() => {
        const media = gsap.matchMedia();

        media.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.fromTo(
                element.current.children,
                { autoAlpha: 0, y: 22 },
                { autoAlpha: 1, y: 0, duration: 0.65, stagger: stagger ? 0.1 : 0, ease: 'power2.out' },
            );
        });

        return () => media.revert();
    }, { scope: element });

    return <div ref={element} className={className}>{children}</div>;
}
