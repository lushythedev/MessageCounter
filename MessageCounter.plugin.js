/**
 * @name MessageCounter
 * @author Lushy
 * @description Counts messages in a specific Discord server and displays the count in a floating window.
 * @version 1.0.0
 * @source https://github.com/lushythedev/MessageCounter
 */

module.exports = class MessageCounter {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.messageCount = 0;
        this.displayElement = null;
        this.observer = null;
        this.targetServerId = "1328046584390225950";
    }

    start() {
        BdApi.showToast("MessageCounter is starting...", {type: "info"});
        this.initialize();
        this.createCounterDisplay();
        this.setupMessageCounter();
    }

    stop() {
        BdApi.showToast("MessageCounter is stopping...", {type: "info"});
        if (this.displayElement) {
            this.displayElement.remove();
        }
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    createCounterDisplay() {
        this.displayElement = document.createElement('div');
        Object.assign(this.displayElement.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            padding: '8px 12px',
            fontSize: '14px',
            borderRadius: '8px',
            zIndex: '9999'
        });
        this.updateCounter();
        document.body.appendChild(this.displayElement);
    }

    updateCounter() {
        if (this.displayElement) {
            this.displayElement.textContent = `Messages: ${this.messageCount}`;
        }
    }

    getCurrentServerId() {
        try {
            const pathMatch = window.location.pathname.match(/\/channels\/(\d+)/);
            if (pathMatch) {
                const serverId = pathMatch[1];
                console.log("[MessageCounter] Current server ID:", serverId);
                return serverId;
            }
        } catch (e) {
            console.error("[MessageCounter] Error getting server ID:", e);
        }
        return null;
    }

    setupMessageCounter() {
        const config = { childList: true, subtree: true };
        
        this.observer = new MutationObserver((mutations) => {
            const currentServerId = this.getCurrentServerId();
            
            if (currentServerId === this.targetServerId) {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) { // ELEMENT_NODE
                            // Check for the li wrapper of messages
                            if (node.tagName === 'LI' && node.getAttribute('class')?.includes('messageListItem')) {
                                this.messageCount++;
                                this.updateCounter();
                                console.log("[MessageCounter] Message counted!");
                                continue;
                            }
                            
                            // Check for message content
                            if (node.querySelector('[class*="messageContent-"]')) {
                                this.messageCount++;
                                this.updateCounter();
                                console.log("[MessageCounter] Message content counted!");
                                continue;
                            }
                            
                            // Check for message wrapper
                            if (node.querySelector('[class*="message-"]')) {
                                this.messageCount++;
                                this.updateCounter();
                                console.log("[MessageCounter] Message wrapper counted!");
                            }
                        }
                    }
                }
            }
        });

        // Function to start observing chat
        const setupObserver = () => {
            // Try to find the chat container
            const chatContainer = document.querySelector(
                '[class*="chatContent-"], ' +
                '[class*="messagesWrapper-"], ' +
                '[class*="scroller-"]'
            );

            if (chatContainer && !this.observer.observing) {
                console.log("[MessageCounter] Found chat container, setting up observer");
                this.observer.observe(chatContainer, config);
                this.observer.observing = true;
            }
        };

        // Initial setup
        setupObserver();

        // Watch for chat container to be added
        const appObserver = new MutationObserver(() => {
            if (!this.observer.observing) {
                setupObserver();
            }
        });

        const app = document.querySelector('#app-mount');
        if (app) {
            appObserver.observe(app, { childList: true, subtree: true });
        }
    }
}
