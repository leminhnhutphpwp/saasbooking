export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'ui-control h-11 w-11 appearance-auto p-3 accent-primary disabled:cursor-not-allowed disabled:opacity-50 ' +
                className
            }
        />
    );
}
