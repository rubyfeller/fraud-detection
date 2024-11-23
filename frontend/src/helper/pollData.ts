export const pollData = async (
    url: string,
    interval: number,
    maxAttempts: number,
    previousData: any = null
) => {
    let attempts = 0;

    while (attempts < maxAttempts) {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (
                data &&
                Object.keys(data).length > 0 &&
                JSON.stringify(data) !== JSON.stringify(previousData)
            ) {
                console.log(Object.keys(data).length);
                return data;
            }
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Polling exceeded maximum attempts');
};