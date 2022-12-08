/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as estate from "./estate";
import * as userLogin from "./userLogin";


export class PanelWebview implements vscode.WebviewViewProvider {
	_view?: vscode.WebviewView;
	_history: string[] = [];

	constructor(private readonly _context: any) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
            enableScripts: true,
			localResourceRoots: [this._context.extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        this.update_webview();
        // if(global.userLogged) {
        //     this.login_success();
        // }
        // if(!global.userLogged) {
        //     this.logout_success();
        // }

        vscode.commands.registerCommand('workbench.action.focusSideBar',  () => {
            webviewView.webview.postMessage({ command: "focus" });
        });

		webviewView.webview.onDidReceiveMessage((data) => {
			switch (data.type) {
				case "presetSelected": {
					let editor = vscode.window.activeTextEditor;
					if (!editor) {
						return;
					}
					// vscode.commands.executeCommand("workbench.action.quickOpen", ">Codify: " + data.value);
					// this.addHistory(data.value);
					estate.saveIntent(data.value);
                    // this.presetIntent(data.value);
					break;
				}
				// case "quickInput": {
				// 	let editor = vscode.window.activeTextEditor;
				// 	if (!editor) {
				// 		return;
				// 	}
				// 	// this.addHistory(data.value);
				// 	estate.saveIntent(data.value);
                //     // this.presetIntent(data.value);
				// 	break;
				// }
                case "login": {
                    vscode.commands.executeCommand('plugin-vscode.login');
                    break;
                }
                case "logout": {
                    vscode.commands.executeCommand("plugin-vscode.logout");
                    break;
                }
                case "js2ts_goto_profile": {
                    vscode.env.openExternal(vscode.Uri.parse(`https://codify.smallcloud.ai/account`));
                    break;
                }
                case "refreshPlan": {
                    global.user_logged_in = "";
                    global.user_active_plan = "";
                    this.update_webview();
                    userLogin.login();
                    break;
                }
				case "openSettings": {
					vscode.commands.executeCommand("plugin-vscode.openSettings");
				}
			}
		});
	}

    public update_webview()
    {
        if (!this._view) {
            return;
        }
        this._view!.webview.postMessage({
            command: "ts2web",
            ts2web_user: global.user_logged_in,
            ts2web_plan: global.user_active_plan,
        });
    }


    // public async presetIntent(intent: string) {
    //     let editor = vscode.window.activeTextEditor;
    //     if (!editor) {
    //         return;
    //     }
    //     let selection = editor.selection;
    //     let selectionEmpty = selection.isEmpty;

    //     if (selectionEmpty) {
    //         if (intent) {
    //             highlight.runHighlight(editor, intent);
    //         }
    //     } else {
    //         if (intent) {
    //             estate.saveIntent(intent);
    //             editor.selection = new vscode.Selection(selection.start, selection.start);
    //             interactiveDiff.queryDiff(editor, selection, "diff-selection");
    //         }
    //     }
    // }

	// public updateQuery(intent: string) {
    //     if (!this._view) {
    //         return;
    //     }
	// 	this._view!.webview.postMessage({ command: "updateQuery", value: intent });
	// }

    // public logout_success() {
    //     if (!this._view) {
    //         return;
    //     }
    //     this._view!.webview.postMessage({
	// 		command: "logout"
	// 	});
    // }

    // public login_success()
    // {
    //     if (!this._view) {
    //         return;
    //     }
    //     this._view!.webview.postMessage({
	// 		command: "login",
    //         value: global.userLogged
	// 	});
    // }

    // public plan_update(txt: string) {
    //     if (!this._view) {
    //         return;
    //     }
	// 	this._view!.webview.postMessage({ command: "updatePlan", value: txt });
	// }

	// public addHistory(intent: string) {
    //     if (!this._view) {
    //         return;
    //     }
	// 	this._history.push(intent);
	// 	this._view!.webview.postMessage({
	// 		command: "updateHistory",
	// 		value: this._history,
	// 	});
	// }

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._context.extensionUri, "assets", "sidebar.js")
		);
		const styleMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._context.extensionUri, "assets", "sidebar.css")
		);

		const nonce = this.getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<!-- <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"> -->
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<title>Presets</title>
                <link href="${styleMainUri}" rel="stylesheet">
			</head>
			<body>
                <div class="sidebar">
                    <div id="sidebar">
                        <h3 class="presets-title">Select & refactor: Press F1</h3>
                        <ul class="presets links-menu">
                            <li tabindex="2">Add type hints</li>
                            <li tabindex="3">Remove type hints</li>
                            <li tabindex="4">Convert to list comprehension</li>
                            <li tabindex="5">Add docstrings</li>
                        </ul>
                    </div>
                    <div class="sidebar-controls">
                        <div class="sidebar-logged">Account: <span></span></div>
                        <div class="sidebar-plan">Active Plan: <span></span><button class="sidebar-plan-button">⟳</button></div>
                        <button tabindex="-1" id="login">Login / Register</button>
                        <button tabindex="-1" id="logout">Logout</button>
                        <button tabindex="-1" id="profile"><span>🔗</span> Your Account...</button>
                        <button tabindex="-1" id="settings">Settings</button>
                    </div>
                </div>
                    <script nonce="${nonce}" src="${scriptUri}"></script>
                </body>
                </html>`;
	}
	getNonce() {
		let text = "";
		const possible =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}

export default PanelWebview;
