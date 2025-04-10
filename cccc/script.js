document.addEventListener('DOMContentLoaded', () => {
    const videoUrlInput = document.getElementById('video-url');
    const downloadBtn = document.getElementById('download-btn');
    const statusDiv = document.getElementById('status');
    const resultsDiv = document.getElementById('results');

    downloadBtn.addEventListener('click', handleDownload);

    // Also handle Enter key press in the input field
    videoUrlInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleDownload();
        }
    });

    async function handleDownload() {
        // Clear previous results
        resultsDiv.innerHTML = '';
        
        // Get the video URL
        const videoUrl = videoUrlInput.value.trim();
        
        // Validate URL
        if (!videoUrl) {
            showStatus('Veuillez entrer une URL de vidéo Facebook.', 'error');
            return;
        }

        // Check if it's likely a Facebook URL
        if (!isValidFacebookUrl(videoUrl)) {
            showStatus('L\'URL ne semble pas être une URL Facebook valide.', 'error');
            return;
        }

        // Show loading state
        showStatus('Récupération des liens de téléchargement...', 'loading');
        downloadBtn.disabled = true;

        try {
            // Call our backend API
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoUrl }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Une erreur est survenue');
            }

            if (!data.success) {
                throw new Error(data.error || 'Une erreur est survenue');
            }

            // Handle success
            showStatus('Liens de téléchargement disponibles:', 'success');
            displayDownloadLinks(data.data);
        } catch (error) {
            showStatus(`Erreur: ${error.message}`, 'error');
            console.error('Error:', error);
        } finally {
            downloadBtn.disabled = false;
        }
    }

    function showStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;
    }

    function isValidFacebookUrl(url) {
        // Basic check for Facebook URLs
        return url.includes('facebook.com/') || 
               url.includes('fb.com/') || 
               url.includes('fb.watch/') ||
               url.includes('m.facebook.com/');
    }

    function displayDownloadLinks(data) {
        // Clear the results container
        resultsDiv.innerHTML = '';

        try {
            if (!data.medias || data.medias.length === 0) {
                showStatus('Aucun lien de téléchargement trouvé.', 'error');
                return;
            }

            // Process each media option
            data.medias.forEach((media, index) => {
                const qualityLabel = getQualityLabel(media);
                
                const optionDiv = document.createElement('div');
                optionDiv.className = 'download-option';

                // Create option header
                const header = document.createElement('h3');
                header.textContent = `Option ${index + 1}: ${qualityLabel}`;
                optionDiv.appendChild(header);

                // Create download link
                const downloadLink = document.createElement('a');
                downloadLink.href = media.url;
                downloadLink.className = 'download-link';
                downloadLink.textContent = `Télécharger ${qualityLabel}`;
                downloadLink.target = '_blank';
                downloadLink.rel = 'noopener noreferrer';
                
                // Set download attribute if possible
                if (media.url) {
                    downloadLink.setAttribute('download', '');
                }
                
                optionDiv.appendChild(downloadLink);
                resultsDiv.appendChild(optionDiv);
            });
        } catch (error) {
            showStatus('Erreur lors du traitement des liens de téléchargement.', 'error');
            console.error('Error processing download links:', error);
        }
    }

    function getQualityLabel(media) {
        // Determine a quality label based on media properties
        if (media.quality) {
            return media.quality;
        } else if (media.formattedSize) {
            return `Vidéo (${media.formattedSize})`;
        } else if (media.width && media.height) {
            return `${media.width}x${media.height}`;
        } else {
            return 'Qualité standard';
        }
    }
});