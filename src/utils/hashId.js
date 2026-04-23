// utils/hashId.js
import Hashids from 'hashids';
const hashids = new Hashids('your-salt-secret-key', 8);

export const encodeId = (id) => hashids.encode(parseInt(id));
export const decodeId = (hash) => {
    const decoded = hashids.decode(hash);
    return decoded.length ? decoded[0].toString() : null;
};