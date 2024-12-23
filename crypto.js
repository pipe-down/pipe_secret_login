const crypto = {
    // 고정된 암호화 키 생성
    getFixedKey: async () => {
        // 실제 배포 시 이 값을 변경하세요
        const keyData = new Uint8Array([
            45, 87, 194, 38, 53, 166, 89, 23,
            91, 244, 90, 183, 47, 95, 113, 21,
            210, 155, 83, 114, 103, 222, 96, 201,
            133, 169, 78, 186, 27, 159, 225, 52
        ]);

        return await window.crypto.subtle.importKey(
            "raw",
            keyData,
            "AES-GCM",
            true,
            ["encrypt", "decrypt"]
        );
    },

    // 문자열을 암호화하여 base64 문자열로 반환
    encrypt: async (text) => {
        try {
            const key = await crypto.getFixedKey();
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encoder = new TextEncoder();
            const encodedText = encoder.encode(text);

            const encryptedData = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                encodedText
            );

            // base64로 인코딩
            const encryptedArray = new Uint8Array(encryptedData);
            const ivArray = new Uint8Array(iv);
            
            return {
                encrypted: btoa(String.fromCharCode.apply(null, encryptedArray)),
                iv: btoa(String.fromCharCode.apply(null, ivArray))
            };
        } catch (error) {
            console.error('암호화 중 오류:', error);
            throw error;
        }
    },

    // base64 문자열을 복호화하여 원본 문자열로 반환
    decrypt: async (encryptedBase64, ivBase64) => {
        try {
            const key = await crypto.getFixedKey();
            
            // base64 디코딩
            const encryptedStr = atob(encryptedBase64);
            const ivStr = atob(ivBase64);
            
            const encryptedArray = new Uint8Array(encryptedStr.split('').map(c => c.charCodeAt(0)));
            const ivArray = new Uint8Array(ivStr.split('').map(c => c.charCodeAt(0)));

            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: ivArray
                },
                key,
                encryptedArray
            );

            return new TextDecoder().decode(decrypted);
        } catch (error) {
            console.error('복호화 중 오류:', error);
            throw error;
        }
    }
};

export default crypto; 