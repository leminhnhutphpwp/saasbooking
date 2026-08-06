import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-foreground">
                    Xóa tài khoản
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    Sau khi tài khoản bị xóa, toàn bộ tài nguyên và dữ liệu sẽ
                    bị xóa vĩnh viễn. Trước khi xóa tài khoản, vui lòng tải về
                    mọi dữ liệu hoặc thông tin bạn muốn giữ lại.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                Xóa tài khoản
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-foreground">
                        Bạn có chắc chắn muốn xóa tài khoản?
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Sau khi tài khoản bị xóa, toàn bộ tài nguyên và dữ liệu
                        sẽ bị xóa vĩnh viễn. Vui lòng nhập mật khẩu để xác nhận
                        bạn muốn xóa tài khoản vĩnh viễn.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Mật khẩu"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4"
                            isFocused
                            placeholder="Mật khẩu"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            Hủy
                        </SecondaryButton>

                        <DangerButton className="ms-3" disabled={processing}>
                            Xóa tài khoản
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
