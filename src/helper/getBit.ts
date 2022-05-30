export default function getBit (number: number, bitPosition: number) {
    return (number & (1 << bitPosition)) === 0 ? 0 : 1
}