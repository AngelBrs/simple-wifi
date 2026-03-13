/**
 * Simple Wifi Extension for micro:bit
 * Communicates with a PC bridge over USB serial to fetch data from localhost.
 * 
 * Protocol (serial messages):
 *   micro:bit → PC:  SWIFI:GET:/your/path
 *   micro:bit → PC:  SWIFI:POST:/your/path:body content here
 *   PC → micro:bit:  SWIFI:DATA:the response string here
 *   PC → micro:bit:  SWIFI:ERR:error message
 */

//% weight=100 color=#1565C0 icon="\uf1eb" block="Simple Wifi"
//% groups='["Setup", "Requests", "Response", "Display"]'
namespace simpleWifi {

    let _lastData: string = "";
    let _lastError: string = "";
    let _isReady: boolean = false;
    let _onDataHandler: ((data: string) => void) | null = null;
    let _onErrorHandler: ((error: string) => void) | null = null;
    let _initialized: boolean = false;

    function _init(): void {
        if (_initialized) return;
        _initialized = true;

        serial.redirectToUSB();
        serial.setBaudRate(BaudRate.BaudRate115200);

        // Listen for incoming serial data line by line
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
            let line = serial.readUntil(serial.delimiters(Delimiters.NewLine)).trim();

            if (line.indexOf("SWIFI:DATA:") === 0) {
                _lastData = line.slice(11);
                _isReady = true;
                if (_onDataHandler) {
                    _onDataHandler(_lastData);
                }
            } else if (line.indexOf("SWIFI:ERR:") === 0) {
                _lastError = line.slice(10);
                _isReady = true;
                if (_onErrorHandler) {
                    _onErrorHandler(_lastError);
                }
            } else if (line === "SWIFI:READY") {
                _isReady = true;
            }
        });
    }

    /**
     * Initialize Simple Wifi. Call this first in your 'on start' block.
     */
    //% block="initialize Simple Wifi"
    //% group="Setup"
    //% weight=100
    export function initialize(): void {
        _init();
        basic.pause(200);
        serial.writeLine("SWIFI:INIT");
        basic.showIcon(IconNames.SmallSquare);
    }

    /**
     * Send a GET request to your localhost server.
     * @param path the URL path to request, e.g. /api/message
     */
    //% block="GET from localhost $path"
    //% group="Requests"
    //% weight=90
    //% path.defl="/api/data"
    export function get(path: string): void {
        _init();
        _isReady = false;
        serial.writeLine("SWIFI:GET:" + path);
    }

    /**
     * Send a POST request to your localhost server.
     * @param path the URL path, e.g. /api/message
     * @param body the body string to send
     */
    //% block="POST to localhost $path with body $body"
    //% group="Requests"
    //% weight=85
    //% path.defl="/api/data"
    //% body.defl="hello"
    export function post(path: string, body: string): void {
        _init();
        _isReady = false;
        serial.writeLine("SWIFI:POST:" + path + ":" + body);
    }

    /**
     * GET data from localhost and display it on the screen. Waits for the response.
     * @param path the URL path to request
     * @param timeout how long to wait in milliseconds
     */
    //% block="GET from localhost $path and display (timeout $timeout ms)"
    //% group="Requests"
    //% weight=80
    //% path.defl="/api/data"
    //% timeout.defl=3000
    export function getAndDisplay(path: string, timeout: number): void {
        _init();
        _isReady = false;
        serial.writeLine("SWIFI:GET:" + path);

        let waited = 0;
        while (!_isReady && waited < timeout) {
            basic.pause(100);
            waited += 100;
        }

        if (_isReady && _lastData.length > 0) {
            basic.showString(_lastData);
        } else {
            basic.showIcon(IconNames.No);
        }
    }

    /**
     * Wait for a response after a request (blocking).
     * @param timeout how many milliseconds to wait
     */
    //% block="wait for response (timeout $timeout ms)"
    //% group="Requests"
    //% weight=75
    //% timeout.defl=3000
    export function waitForResponse(timeout: number): void {
        _init();
        let waited = 0;
        while (!_isReady && waited < timeout) {
            basic.pause(100);
            waited += 100;
        }
    }

    /**
     * Runs a block of code when data is received from the PC.
     */
    //% block="on data received"
    //% group="Response"
    //% weight=70
    //% draggableParameters="reporter"
    export function onDataReceived(handler: (data: string) => void): void {
        _init();
        _onDataHandler = handler;
    }

    /**
     * Runs a block of code when an error is received from the PC.
     */
    //% block="on error received"
    //% group="Response"
    //% weight=65
    //% draggableParameters="reporter"
    export function onErrorReceived(handler: (error: string) => void): void {
        _init();
        _onErrorHandler = handler;
    }

    /**
     * Get the last received data string.
     */
    //% block="last received data"
    //% group="Response"
    //% weight=60
    export function lastData(): string {
        return _lastData;
    }

    /**
     * Get the last error message.
     */
    //% block="last error message"
    //% group="Response"
    //% weight=55
    export function lastError(): string {
        return _lastError;
    }

    /**
     * Returns true if a response has been received since the last request.
     */
    //% block="response is ready"
    //% group="Response"
    //% weight=50
    export function isReady(): boolean {
        return _isReady;
    }

    /**
     * Display the last received data string on the LED matrix.
     */
    //% block="display last received data"
    //% group="Display"
    //% weight=45
    export function displayLastData(): void {
        basic.showString(_lastData.length > 0 ? _lastData : "(no data)");
    }

    /**
     * Scroll a specific string across the LED display.
     * @param data the string to display
     */
    //% block="display string $data"
    //% group="Display"
    //% weight=40
    export function displayString(data: string): void {
        basic.showString(data);
    }

    /**
     * Clears the last received data and error.
     */
    //% block="clear last response"
    //% group="Response"
    //% weight=30
    export function clearResponse(): void {
        _lastData = "";
        _lastError = "";
        _isReady = false;
    }
}