import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

app.registerExtension({
	name: "Comfy.RebootSidePanel",
	setup(app) {
		if (app.extensionManager && app.extensionManager.registerSidebarTab) {
			app.extensionManager.registerSidebarTab({
				id: "reboot-panel",
				title: "Restart",
				icon: "pi pi-refresh",
				tooltip: "Restart server",
				type: "custom",
				render(container) {
					container.style.padding = "20px";
					container.innerHTML = `
                        <div style="display:flex; flex-direction:column; gap:16px;">
                            <h3 style="margin:0; color:var(--input-text, #fff); font-size:18px;">
                                Restart
                            </h3>
                            <p style="margin:0; color:var(--descrip-text, #aaa); font-size:13px;">
                                Click the button below to restart the ComfyUI server. The page will automatically reconnect.
                            </p>
                            <button id="reboot-sidebar-btn" style="
                                padding: 12px 24px;
                                background: #26a69a;
                                color: #000;
                                border: none;
                                border-radius: 8px;
                                font-size: 15px;
                                font-weight: 600;
                                cursor: pointer;
                                width: 100%;
                                transition: background 0.2s;
                            ">
                                🔄 Restart
                            </button>
                            <div id="reboot-status" style="
                                color: var(--descrip-text, #aaa);
                                font-size: 13px;
                                min-height: 20px;
                            "></div>
                        </div>
                    `;

					const btn = container.querySelector("#reboot-sidebar-btn");
					const status = container.querySelector("#reboot-status");

					btn.onmouseenter = () => { btn.style.background = "#1d8c82"; };
					btn.onmouseleave = () => { btn.style.background = "#26a69a"; };

					btn.onclick = async () => {
						if (!confirm("Are you sure you want to restart?")) return;

						btn.disabled = true;
						btn.style.opacity = "0.6";
						btn.style.cursor = "not-allowed";
						btn.textContent = "⏳ Restarting...";
						status.textContent = "Sending restart command...";

						try {
							await fetch("/reboot", { method: "POST" });
							status.textContent = "Restart command sent! Waiting for server...";
							status.style.color = "#2ecc71";

							// Poll until server comes back
							let attempts = 0;
							const poll = setInterval(async () => {
								attempts++;
								try {
									const resp = await fetch("/system_stats");
									if (resp.ok) {
										clearInterval(poll);
										status.textContent = "Server is back! Reloading page...";
										setTimeout(() => location.reload(), 1000);
									}
								} catch (e) {
									status.textContent = `Waiting for server... (${attempts}s)`;
								}
								if (attempts > 60) {
									clearInterval(poll);
									status.textContent = "Server did not come back. Please refresh manually.";
									status.style.color = "#e74c3c";
									btn.disabled = false;
									btn.style.opacity = "1";
									btn.style.cursor = "pointer";
									btn.textContent = "🔄 Restart";
								}
							}, 1000);
						} catch (err) {
							// fetch will fail because server dies - this is expected!
							status.textContent = "Server stopped. Waiting for restart...";
							status.style.color = "#f39c12";

							// Poll until server comes back
							let attempts = 0;
							const poll = setInterval(async () => {
								attempts++;
								try {
									const resp = await fetch("/system_stats");
									if (resp.ok) {
										clearInterval(poll);
										status.textContent = "Server is back! Reloading page...";
										status.style.color = "#2ecc71";
										setTimeout(() => location.reload(), 1000);
									}
								} catch (e) {
									status.textContent = `Waiting for server... (${attempts}s)`;
								}
								if (attempts > 60) {
									clearInterval(poll);
									status.textContent = "Server did not come back. Please refresh manually.";
									status.style.color = "#e74c3c";
									btn.disabled = false;
									btn.style.opacity = "1";
									btn.style.cursor = "pointer";
									btn.textContent = "🔄 Restart";
								}
							}, 1000);
						}
					};
				},
				destroy() { }
			});
		}
	}
});
