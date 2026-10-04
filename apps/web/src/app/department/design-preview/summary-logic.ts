/** Largest-remainder allocation keeps integer chart buckets equal to their headline total. */
export function apportion(total: number, weights: number[]) {
    const sum = weights.reduce((n, v) => n + v, 0);
    if (!sum || total <= 0)
        return weights.map(() => 0);
    const exact = weights.map(w => total * w / sum), result = exact.map(Math.floor);
    const order = exact.map((value, index) => ({ index, remainder: value - result[index] })).sort((a, b) => b.remainder - a.remainder || a.index - b.index);
    const remaining = total - result.reduce((n, v) => n + v, 0);
    for (let i = 0; i < remaining; i++)
        result[order[i].index]++;
    return result;
}
