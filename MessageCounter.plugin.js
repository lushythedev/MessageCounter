/**
 * @name MessageCounter
 * @author Lushy (improved version)
 * @description Counts messages in a specific Discord server and displays the count in a floating window.
 * @version 1.1.0
 */

module.exports = class MessageCounter {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.messageCount = 0;
        this.displayElement = null;
        this.observer = null;
        this.appObserver = null;
        this.targetServerId = "1328046584390225950";
        this.isObserving = false;
        this.retryAttempts = 0;
        this.maxRetries = 10;
        this.retryDelay = 1000; // 1 second
    }

    start() {
        console.log("MessageCounter: Starting...");
        this.initialize();
        this.setupWithRetry();
    }

    stop() {
        console.log("MessageCounter: Stopping...");
        if (this.displayElement && this.displayElement.parentNode) {
            this.displayElement.parentNode.removeChild(this.displayElement);
        }
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.appObserver) {
            this.appObserver.disconnect();
        }
        this.cleanup();
    }

    cleanup() {
        // Clean up any existing elements that might be leftover
        const existingCounters = document.querySelectorAll('.message-counter-display');
        existingCounters.forEach(counter => {
            if (counter && counter.parentNode) {
                counter.parentNode.removeChild(counter);
            }
        });
    }

    async setupWithRetry() {
        try {
            const app = await this.waitForElement('#app-mount');
            if (app) {
                this.cleanup();
                this.createCounterDisplay();
                this.setupMessageCounter();
                this.retryAttempts = 0;
            }
        } catch (error) {
            console.error('MessageCounter: Setup failed, retrying...', error);
            this.retryAttempts++;
            if (this.retryAttempts < this.maxRetries) {
                setTimeout(() => this.setupWithRetry(), this.retryDelay);
            }
        }
    }

    async waitForElement(selector) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) return resolve(element);

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Set a timeout to avoid waiting forever
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found after timeout`));
            }, 10000);
        });
    }

    createCounterDisplay() {
        this.displayElement = document.createElement('div');
        this.displayElement.className = 'message-counter-display';
        Object.assign(this.displayElement.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            padding: '8px 12px',
            fontSize: '14px',
            borderRadius: '8px',
            zIndex: '9999',
            userSelect: 'none',
            pointerEvents: 'none',
            fontFamily: 'gg sans, Helvetica Neue, Helvetica, Arial, sans-serif'
        });
        this.updateCounter();
        document.body.appendChild(this.displayElement);
    }

    updateCounter() {
        if (this.displayElement) {
            const serverId = this.getCurrentServerId();
            const isTargetServer = serverId === this.targetServerId;
            this.displayElement.style.display = isTargetServer ? 'block' : 'none';
            if (isTargetServer) {
                this.displayElement.textContent = `Messages: ${this.messageCount}`;
            }
        }
    }

    getCurrentServerId() {
        try {
            const match = window.location.pathname.match(/\/channels\/(\d+)/);
            return match ? match[1] : null;
        } catch (e) {
            console.error('MessageCounter: Error getting server ID:', e);
            return null;
        }
    }

    isValidMessage(node) {
        if (!node || node.nodeType !== 1) return false;

        // More specific Discord message detection
        const messageIndicators = [
            '[class*="message-"]',
            '[class*="messageContent-"]',
            '[class*="container-"]'
        ];

        const hasMessageIndicator = messageIndicators.some(selector => {
            try {
                return node.matches(selector) || node.querySelector(selector);
            } catch {
                return false;
            }
        });

        if (!hasMessageIndicator) return false;

        // Exclude system messages and other non-user messages
        const isSystemMessage = node.classList?.contains('systemMessage-');
        if (isSystemMessage) return false;

        // Additional validation
        const hasUserContent = node.querySelector('[class*="contents-"], [class*="messageContent-"]');
        const hasTimestamp = node.querySelector('[class*="timestamp-"]');

        return hasUserContent && hasTimestamp;
    }

    setupMessageCounter() {
        const config = { 
            childList: true, 
            subtree: true,
            attributes: false,
            characterData: false
        };

        this.observer = new MutationObserver((mutations) => {
            const currentServerId = this.getCurrentServerId();
            
            if (currentServerId === this.targetServerId) {
                let newMessages = 0;
                
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (this.isValidMessage(node)) {
                            newMessages++;
                        }
                    }
                }

                if (newMessages > 0) {
                    this.messageCount += newMessages;
                    this.updateCounter();
                    console.log(`MessageCounter: ${newMessages} new message(s) detected. Total: ${this.messageCount}`);
                }
            }
        });

        this.observeChat();

        // Watch for navigation and chat container changes
        this.appObserver = new MutationObserver(() => {
            if (!this.isObserving) {
                this.observeChat();
            }
        });

        const app = document.querySelector('#app-mount');
        if (app) {
            this.appObserver.observe(app, {
                childList: true,
                subtree: true
            });
        }
    }

    async observeChat() {
        if (this.isObserving) return;

        try {
            const chatSelectors = [
                '[class*="chat-"]',
                '[class*="chatContent-"]',
                '[class*="messagesList-"]',
                '[class*="messages-"]',
                '.messageListItem-'
            ];

            let chatContainer = null;
            for (const selector of chatSelectors) {
                try {
                    chatContainer = document.querySelector(selector);
                    if (chatContainer) break;
                } catch (e) {
                    continue;
                }
            }

            if (chatContainer) {
                console.log("MessageCounter: Found chat container, setting up observer");
                this.observer.observe(chatContainer, {
                    childList: true,
                    subtree: true
                });
                this.isObserving = true;
            }
        } catch (error) {
            console.error('MessageCounter: Error setting up chat observer:', error);
            this.isObserving = false;
        }
    }
}
