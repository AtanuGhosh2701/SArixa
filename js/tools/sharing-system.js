/**
 * SArixa Native File Share System
 * 100% Private, Zero Server Uploads.
 */

export async function sharePdfFile(fileData, fileName, buttonElement, customText, mimeType = "application/pdf") {
    if (!navigator.canShare) {
        alert("Your browser/device doesn't support native file sharing. Please download the file instead.");
        return;
    }

    let shareFiles = [];
    
    if (Array.isArray(fileData)) {
        shareFiles = fileData;
    } else {
        shareFiles = [new File([fileData], fileName, { type: mimeType })];
    }

    if (!navigator.canShare({ files: shareFiles })) {
        alert("Security Limit: Direct file sharing is not supported by your browser for this file type or file size. Please use the Download button.");
        return;
    }

    const originalBtnHTML = buttonElement.innerHTML;

    let shareMessage = customText || 'Here is the document I processed securely using SArixa.';
    const promotionalFooter = "\n\n🚀 𝑷𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 *SArixa* ✨\n🔒 100% Private | ⚡ Lightning Fast | 🆓 Free Forever\n🌐 Try it now: https://sarixa-tools.vercel.app/";

    if (!shareMessage.includes("sarixa-tools.vercel.app")) {
        shareMessage += promotionalFooter;
    }

    try {
        buttonElement.disabled = true;
        buttonElement.innerHTML = `<div class="spinner" style="display:inline-block; border-color: rgba(0, 34, 51, 0.3); border-top-color: #002233;"></div> Sharing...`;
        
        try {
            await navigator.share({
                files: shareFiles,
                title: 'SArixa Files',
                text: shareMessage
            });
        } catch (firstErr) {
            if (firstErr.name !== 'AbortError' && shareFiles.length > 1) {
                await navigator.share({
                    files: shareFiles
                });
            } else {
                throw firstErr;
            }
        }
        
        console.log("Files shared successfully.");
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error("Error sharing file:", error);
            if (error.message && error.message.includes("large")) {
                alert("File size is too large to share directly via social apps. Please click the 'Download ZIP' button.");
            } else {
                alert("Sharing failed or cancelled by browser. Please use the Download button instead.");
            }
        }
    } finally {
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalBtnHTML;
    }
}