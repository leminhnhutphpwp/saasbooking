export default function SectionHeading({ eyebrow, title, detail, light = false, as: Heading = 'h2' }) {
    return <div className="max-w-2xl"><p className={`text-sm font-extrabold uppercase tracking-[.12em] ${light ? 'text-primary' : 'text-primary'}`}>{eyebrow}</p><Heading className={`mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl ${light ? 'text-background' : 'text-foreground'}`}>{title}</Heading>{detail && <p className={`mt-5 text-lg leading-relaxed ${light ? 'text-background/70' : 'text-muted-foreground'}`}>{detail}</p>}</div>;
}
