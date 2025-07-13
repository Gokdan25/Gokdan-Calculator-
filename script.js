document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const calculator = {
        previousOperandElement: document.getElementById('previous-operand'),
        currentOperandElement: document.getElementById('current-operand'),
        historyItemsElement: document.getElementById('history-items'),
        themeToggle: document.querySelector('.theme-toggle'),
        soundToggle: document.querySelector('.sound-toggle'),
        historyToggle: document.querySelector('.history-toggle'),
        historyPanel: document.querySelector('.history-panel'),
        clearHistoryBtn: document.querySelector('.btn-clear-history'),
        buttons: document.querySelectorAll('.btn'),
        clickSound: document.getElementById('clickSound'),
        equalsSound: document.getElementById('equalsSound'),
        errorSound: document.getElementById('errorSound')
    };

    // Calculator state
    let state = {
        currentOperand: '0',
        previousOperand: '',
        operation: undefined,
        soundEnabled: true,
        history: []
    };

    // Initialize
    init();

    function init() {
        // Load from localStorage
        const savedState = localStorage.getItem('calculatorState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            state = { ...state, ...parsed };
            updateDisplay();
            renderHistory();
        }

        // Check for saved theme preference
        const savedTheme = localStorage.getItem('calculatorTheme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            calculator.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }

        // Check for saved sound preference
        const savedSound = localStorage.getItem('calculatorSound');
        if (savedSound === 'false') {
            state.soundEnabled = false;
            calculator.soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }

        // Event listeners
        calculator.buttons.forEach(button => {
            button.addEventListener('click', () => {
                handleButtonClick(button.dataset.value);
                animateButton(button);
            });
        });

        calculator.themeToggle.addEventListener('click', toggleTheme);
        calculator.soundToggle.addEventListener('click', toggleSound);
        calculator.historyToggle.addEventListener('click', toggleHistoryPanel);
        calculator.clearHistoryBtn.addEventListener('click', clearHistory);

        // Keyboard support
        document.addEventListener('keydown', handleKeyboardInput);
    }

    function handleButtonClick(value) {
        if (state.soundEnabled) {
            playSound('click');
        }

        if (isNumber(value)) {
            appendNumber(value);
        } else if (value === '.') {
            appendDecimal();
        } else if (isOperator(value)) {
            chooseOperation(convertOperator(value));
        } else if (value === '=' || value === 'Enter') {
            compute();
        } else if (value === 'AC') {
            clear();
        } else if (value === 'DEL') {
            deleteNumber();
        } else if (value === '±') {
            toggleSign();
        }

        updateDisplay();
    }

    function handleKeyboardInput(e) {
        const key = e.key;
        
        if (isNumber(key) || 
            key === '.' || 
            key === '+' || 
            key === '-' || 
            key === '*' || 
            key === '/' || 
            key === 'Enter' || 
            key === 'Escape' || 
            key === 'Backspace' || 
            key === 'Delete') {
            
            e.preventDefault();
            
            let buttonValue;
            if (key === 'Enter') buttonValue = '=';
            else if (key === 'Escape') buttonValue = 'AC';
            else if (key === 'Backspace') buttonValue = 'DEL';
            else if (key === 'Delete') buttonValue = 'AC';
            else buttonValue = key;
            
            const button = document.querySelector(`.btn[data-value="${buttonValue}"]`);
            if (button) {
                handleButtonClick(buttonValue);
                animateButton(button);
            }
        }
    }

    function animateButton(button) {
        button.classList.add('active');
        setTimeout(() => {
            button.classList.remove('active');
        }, 150);
    }

    function isNumber(value) {
        return !isNaN(value) || value === '.';
    }

    function isOperator(value) {
        return value === '+' || value === '-' || value === '×' || value === '÷';
    }

    function convertOperator(operator) {
        if (operator === '×') return '*';
        if (operator === '÷') return '/';
        return operator;
    }

    function appendNumber(number) {
        if (number === '0' && state.currentOperand === '0') return;
        if (number !== '0' && state.currentOperand === '0') {
            state.currentOperand = number;
            return;
        }
        if (state.currentOperand.length >= 15) return;
        
        state.currentOperand += number;
    }

    function appendDecimal() {
        if (state.currentOperand.includes('.')) return;
        if (state.currentOperand === '') {
            state.currentOperand = '0.';
        } else {
            state.currentOperand += '.';
        }
    }

    function chooseOperation(operation) {
        if (state.currentOperand === '' && state.previousOperand === '') return;
        
        if (state.currentOperand === '') {
            state.operation = operation;
            return;
        }
        
        if (state.previousOperand !== '') {
            compute();
        }
        
        state.operation = operation;
        state.previousOperand = state.currentOperand;
        state.currentOperand = '';
    }

    function compute() {
        let computation;
        const prev = parseFloat(state.previousOperand);
        const current = parseFloat(state.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;
        
        switch (state.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '*':
                computation = prev * current;
                break;
            case '/':
                if (current === 0) {
                    if (state.soundEnabled) {
                        playSound('error');
                    }
                    state.currentOperand = 'Error';
                    state.previousOperand = '';
                    state.operation = undefined;
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }
        
        if (state.soundEnabled) {
            playSound('equals');
        }
        
        // Add to history
        addToHistory(prev, current, state.operation, computation);
        
        state.currentOperand = computation.toString();
        state.operation = undefined;
        state.previousOperand = '';
    }

    function clear() {
        state.currentOperand = '0';
        state.previousOperand = '';
        state.operation = undefined;
    }

    function deleteNumber() {
        if (state.currentOperand === '0') return;
        if (state.currentOperand.length === 1) {
            state.currentOperand = '0';
        } else {
            state.currentOperand = state.currentOperand.slice(0, -1);
        }
    }

    function toggleSign() {
        if (state.currentOperand === '0') return;
        if (state.currentOperand.startsWith('-')) {
            state.currentOperand = state.currentOperand.substring(1);
        } else {
            state.currentOperand = '-' + state.currentOperand;
        }
    }

    function updateDisplay() {
        calculator.currentOperandElement.innerText = getDisplayNumber(state.currentOperand);
        
        if (state.operation != null) {
            const operatorSymbol = state.operation === '*' ? '×' : state.operation === '/' ? '÷' : state.operation;
            calculator.previousOperandElement.innerText = 
                `${getDisplayNumber(state.previousOperand)} ${operatorSymbol}`;
        } else {
            calculator.previousOperandElement.innerText = state.previousOperand;
        }
        
        // Save state to localStorage
        localStorage.setItem('calculatorState', JSON.stringify({
            currentOperand: state.currentOperand,
            previousOperand: state.previousOperand,
            operation: state.operation,
            history: state.history
        }));
    }

    function getDisplayNumber(number) {
        if (number === '') return '';
        if (number === 'Error') return 'Error';
        
        const floatNumber = parseFloat(number);
        if (isNaN(floatNumber)) return '';
        
        // Format number with commas
        return floatNumber.toLocaleString('en-US', {
            maximumFractionDigits: 8
        });
    }

    function addToHistory(prev, current, operation, result) {
        const operatorSymbol = operation === '*' ? '×' : operation === '/' ? '÷' : operation;
        const historyItem = {
            equation: `${prev} ${operatorSymbol} ${current}`,
            result: result
        };
        
        state.history.unshift(historyItem);
        if (state.history.length > 10) {
            state.history.pop();
        }
        
        renderHistory();
    }

    function renderHistory() {
        calculator.historyItemsElement.innerHTML = '';
        
        state.history.forEach((item, index) => {
            const historyItemElement = document.createElement('div');
            historyItemElement.classList.add('history-item');
            historyItemElement.innerHTML = `
                <div class="history-equation">${item.equation}</div>
                <div class="history-result">${getDisplayNumber(item.result.toString())}</div>
            `;
            
            historyItemElement.addEventListener('click', () => {
                state.currentOperand = item.result.toString();
                updateDisplay();
            });
            
            calculator.historyItemsElement.appendChild(historyItemElement);
        });
    }

    function clearHistory() {
        state.history = [];
        renderHistory();
    }

    function toggleTheme() {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';
        
        if (isDark) {
            html.removeAttribute('data-theme');
            calculator.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('calculatorTheme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
            calculator.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('calculatorTheme', 'dark');
        }
    }

    function toggleSound() {
        state.soundEnabled = !state.soundEnabled;
        
        if (state.soundEnabled) {
            calculator.soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
            calculator.soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
        
        localStorage.setItem('calculatorSound', state.soundEnabled);
    }

    function toggleHistoryPanel() {
        calculator.historyPanel.classList.toggle('active');
        calculator.historyToggle.classList.toggle('active');
    }

    function playSound(type) {
        let sound;
        
        switch (type) {
            case 'click':
                sound = calculator.clickSound;
                break;
            case 'equals':
                sound = calculator.equalsSound;
                break;
            case 'error':
                sound = calculator.errorSound;
                break;
            default:
                return;
        }
        
        sound.currentTime = 0;
        sound.play();
    }
});