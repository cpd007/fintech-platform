async function deposit() {
    const amount = document.getElementById('deposit-amount').value;
    const response = await fetch('/deposit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: 1, amount: parseFloat(amount) })
    });
    const data = await response.json();
    console.log(data);
}

async function withdraw() {
    const amount = document.getElementById('withdraw-amount').value;
    const response = await fetch('/withdraw', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: 1, amount: parseFloat(amount) })
    });
    const data = await response.json();
    console.log(data);
}
