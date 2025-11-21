export const Keyboard = (keyCode) => {
    const key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;

    key.downHandler = (event) => {
        if (event.code === key.code) {
            // Đặt trạng thái trước, rồi gọi press() để handler nhìn thấy isDown === true
            key.isDown = true;
            key.isUp = false;
            if (key.isDown && key.press) key.press();
            event.preventDefault();
        }
    };

    key.upHandler = (event) => {
        if (event.code === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
            event.preventDefault();
        }
    };

    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);

    window.addEventListener('keydown', downListener, false);
    window.addEventListener('keyup', upListener, false);

    key.unsubscribe = () => {
        window.removeEventListener('keydown', downListener);
        window.removeEventListener('keyup', upListener);
    };

    return key;
};