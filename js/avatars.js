/**
 * 头像系统 — 100个 Emoji + 渐变底色组合
 * 采用 HSL 色相环均匀分布，确保 100 种截然不同的色系
 */

const EMOJIS = [
    '😀', '😎', '🥳', '🤩', '😺', '🐶', '🐱', '🐼', '🦊', '🐯',
    '🦁', '🐻', '🐨', '🐸', '🐵', '🐔', '🐧', '🦄', '🐝', '🦋',
    '🌸', '🌺', '🌻', '🍀', '🌈', '⭐', '🌙', '☀️', '🔥', '💧',
    '❄️', '🍎', '🍊', '🍋', '🍉', '🍇', '🍓', '🥝', '🍑', '🥑',
    '🎯', '🎸', '🎨', '🎭', '🎪', '🏆', '⚡', '💎', '🎵', '🎮',
    '🚀', '🛸', '🌍', '🏔️', '🌊', '🎈', '🎁', '🧩', '🎲', '🃏',
    '🦸', '🧙', '🧚', '🦹', '👻', '🤖', '👽', '💀', '🎃', '🐲',
    '🦅', '🐬', '🦊', '🐻‍❄️', '🦩', '🐙', '🦑', '🐢', '🦎', '🐍',
    '🌵', '🎋', '🍁', '🌴', '🎄', '💐', '🌷', '🥀', '🌼', '🏵️',
    '🧊', '🪐', '🌟', '💫', '✨', '🎆', '🎇', '🏮', '🎑', '🪷'
];

/**
 * 生成 100 个头像配置
 * @returns {Array<{emoji: string, bg: string, id: number}>}
 */
export function generateAvatars() {
    const avatars = [];
    for (let i = 0; i < 100; i++) {
        const hue = (i * 3.6) % 360;
        const sat1 = 65 + (i % 3) * 10;   // 65-85%
        const lit1 = 55 + (i % 4) * 5;    // 55-70%
        const hue2 = (hue + 35) % 360;

        avatars.push({
            id: i,
            emoji: EMOJIS[i],
            bg: `linear-gradient(135deg, hsl(${hue}, ${sat1}%, ${lit1}%), hsl(${hue2}, ${sat1 - 10}%, ${lit1 - 15}%))`
        });
    }
    return avatars;
}

/** 渲染头像到 Canvas 或返回 DOM 元素 */
export function createAvatarElement(avatar, size = 48) {
    const el = document.createElement('div');
    el.className = 'avatar';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.background = avatar.bg;
    el.style.borderRadius = '50%';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontSize = (size * 0.55) + 'px';
    el.style.lineHeight = '1';
    el.textContent = avatar.emoji;
    el.dataset.avatarId = avatar.id;
    return el;
}
