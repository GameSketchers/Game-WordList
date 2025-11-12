// The anonymous function is used to isolate variables from the global scope.
// The `global` variable ensures that the code works both in the browser (window) and in a Node.js environment.
(function (global) {

    // The getWordList function returns a word list using either a room code or a direct URL.
    function getWordList(roomCode) {
        // Define the base URL. Word lists will be fetched from this GitHub repository.
        const BASE_URL = "https://raw.githubusercontent.com/GameSketchers/Game-WordList/main/";
        const LANGUAGES_URL = BASE_URL + "languages/";

        // A helper function to print colorful and clear error/warning messages in the console.
        function logMessage(message, color = "red") {
            console.log(`%c${message}\nHelp us expand our word database: https://github.com/GameSketchers/Game-WordList`, 
                        `color: ${color}; font-weight: bold;`);
        }

        // A helper function to fetch JSON data synchronously.
        // A blocking (synchronous) request is sent using XMLHTTPRequest.
        function fetchJson(url) {
            try {
                let request = new XMLHttpRequest();
                request.open("GET", url, false); // Synchronous request (should be used carefully)
                request.send(null);
                return JSON.parse(request.responseText); // Parse and return JSON data
            } catch {
                return null; // Return null in case of an error
            }
        }

        // A function that extracts language and theme indexes from the room code.
        function parseRoomCode(code) {
            // The first two characters represent the language ID (e.g., "38" -> 38 - 30 = 8)
            const roomId = +code.slice(0, 2) - 30;

            // The third character determines the theme ID.
            // If the character is a number, it is used directly as a number. For example, in "384", '4' is directly taken as 4.
            // If the character is a letter, a special conversion is applied:
            // - The alphabet index is determined in order, but instead of starting from 0, it starts from 10.
            // - For lowercase letters (a-z), the index starts at 10. So "a" -> 10, "b" -> 11, ..., "z" -> 35.
            // - For uppercase letters (A-Z), the index starts at 36. So "A" -> 36, "B" -> 37, "C" -> 38, etc.
            // This allows both numbers and letters to represent themes.

            const themeIndex = isNaN(code[2])
            ? "abcdefghijklmnopqrstuvwxyz".indexOf(code[2].toLowerCase()) + (code[2] === code[2].toLowerCase() ? 10 : 36)
            : +code[2];

            // Return null if invalid values are detected.
            return isNaN(roomId) || themeIndex === null ? null : [roomId, themeIndex];
        }

        // If the input is a valid URL, use it directly; otherwise, process the room code.
        let wordListUrl = roomCode.startsWith(BASE_URL) ? roomCode : (() => {
            // Extract language and theme indexes from the room code.
            const [roomId, themeIndex] = parseRoomCode(roomCode) || [];

            // Display an error message if the code is invalid or missing.
            if (roomId === undefined || themeIndex === undefined) {
                return logMessage("Sorry! You have entered an incorrect or missing room code.");
            }

            // Fetch the language and theme JSON files.
            const languagesData = fetchJson(BASE_URL + "src/languages-data.json");
            const themesData = fetchJson(BASE_URL + "src/themes-data.json");

            // Return an error message if data is missing.
            return (languagesData && themesData)
                ? `${LANGUAGES_URL}${languagesData[roomId]}/${themesData[themeIndex]}.json`
                : logMessage("Sorry! You have entered an incorrect or missing room code.");
        })();

        // Security check: If the URL points to an external source instead of the defined GitHub repository, return an error.
        if (!wordListUrl.startsWith(LANGUAGES_URL)) {
            return logMessage("Security Error: Invalid URL detected!");
        }

        // Finally, fetch the word list; if not found, display an error message.
        return fetchJson(wordListUrl) || logMessage("Sorry! We don't have a word list for this game room.", "orange");
    }

    // Export the module for use in both browser and Node.js environments.
    if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
        module.exports = getWordList; // For Node.js
    } else {
        global.getWordList = getWordList; // For browser
    }

})(typeof window !== "undefined" ? window : this);
