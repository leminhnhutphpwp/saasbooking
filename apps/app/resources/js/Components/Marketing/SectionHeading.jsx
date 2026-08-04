export default function SectionHeading({ eyebrow, title, detail, light = false, as: Heading = 'h2' }) {
    return <div className="max-w-2xl"><p className={`text-sm font-extrabold uppercase tracking-[.15em] ${light ? 'text-[#d9ff76]' : 'text-[#43815a]'}`}>{eyebrow}</p><Heading className={`mt-3 text-4xl font-black leading-[1.02] tracking-[-.055em] sm:text-5xl ${light ? 'text-white' : 'text-[#163d2e]'}`}>{title}</Heading>{detail && <p className={`mt-5 text-lg leading-relaxed ${light ? 'text-white/70' : 'text-[#658073]'}`}>{detail}</p>}</div>;
}
