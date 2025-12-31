const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;
const DATA_PATH = path.join(__dirname, 'src', 'data', 'dailyCars.json');

app.use(cors());
app.use(bodyParser.json());

// Get all puzzles
app.get('/api/puzzles', (req, res) => {
    fs.readFile(DATA_PATH, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });
        res.json(JSON.parse(data));
    });
});

// Update a puzzle
app.put('/api/puzzles/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updatedCar = req.body;

    fs.readFile(DATA_PATH, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });

        let dailyCars = JSON.parse(data);
        const index = dailyCars.findIndex(c => c.id === id);

        if (index === -1) return res.status(404).json({ error: 'Car not found' });

        dailyCars[index] = { ...dailyCars[index], ...updatedCar };

        fs.writeFile(DATA_PATH, JSON.stringify(dailyCars, null, 4), (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save data' });
            res.json(dailyCars[index]);
        });
    });
});

// Add a new puzzle
app.post('/api/puzzles', (req, res) => {
    const newCar = req.body;

    fs.readFile(DATA_PATH, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });

        let dailyCars = JSON.parse(data);

        // Auto-assign ID if missing
        if (!newCar.id) {
            const lastId = dailyCars.reduce((max, car) => Math.max(max, car.id || 0), 0);
            newCar.id = lastId + 1;
        }

        dailyCars.push(newCar);

        fs.writeFile(DATA_PATH, JSON.stringify(dailyCars, null, 4), (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save data' });
            res.json(newCar);
        });
    });
});

// Delete a puzzle
app.delete('/api/puzzles/:id', (req, res) => {
    const id = parseInt(req.params.id);

    fs.readFile(DATA_PATH, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });

        let dailyCars = JSON.parse(data);
        const filteredCars = dailyCars.filter(c => c.id !== id);

        if (dailyCars.length === filteredCars.length) {
            return res.status(404).json({ error: 'Car not found' });
        }

        fs.writeFile(DATA_PATH, JSON.stringify(filteredCars, null, 4), (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save data' });
            res.json({ success: true });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Cardle Dev Backend running on http://localhost:${PORT}`);
});
