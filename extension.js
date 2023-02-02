const vscode = require('vscode');
const fetch = require('node-fetch');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('stac.query', function () {

		let apiOptions = {
			prompt: "STAC API: ",
			value: "https://planetarycomputer.microsoft.com/api/stac/v1"
		}

		vscode.window.showInputBox(apiOptions).then(apiValue => {
			if (!apiValue) return;

			let getRequestOptions = {
				method: 'GET',
				redirect: 'follow'
			};

			fetch(apiValue + "/collections", getRequestOptions)
				.then(response => response.json())
				.then(collectionsResult => {
					collectionIds = []
					for (const collection of collectionsResult.collections) {
						collectionIds.push(collection.id)
					}

					let collectionSelectOptions = {
						title: "Collection(s):",
					}

					vscode.window.showQuickPick(collectionIds, collectionSelectOptions).then(collectionId => {
						let collection = collectionsResult.collections.filter(obj => {
							return obj.id === collectionId
						})

						let startDateOptions = {
							prompt: "Start Date: ",
							value: collection[0].extent.temporal.interval[0][0]
						}

						vscode.window.showInputBox(startDateOptions).then(startDateValue => {
							let endDateOptions = {
								prompt: "End Date: ",
								value: collection[0].extent.temporal.interval[0][1] || new Date().toISOString()
							}

							vscode.window.showInputBox(endDateOptions).then(endDateValue => {
								let bboxOptions = {
									prompt: "Bounding Box [w, s, e, n]: ",
									value: collection[0].extent.spatial.bbox[0]
								}

								vscode.window.showInputBox(bboxOptions).then(bboxValue => {
									var raw = JSON.stringify({
										"collections": [
											collectionId
										],
										"bbox": bboxValue.split(","),
										"datetime": `${startDateValue}/${endDateValue}`,
										"limit": 1
									});

									var requestOptions = {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json'
										},
										body: raw,
										redirect: 'follow'
									};

									fetch(apiValue + "/search", requestOptions)
										.then(response => response.text())
										.then(searchResult => {
											let fileOptions = {
												content: searchResult,
												language: "json"
											}

											vscode.workspace.openTextDocument(fileOptions).then((document) => {
												console.log(document)
											});
										})
										.catch(error => console.log('error', error));
								})
							})
						})
					})
				})
				.catch(error => {
					vscode.window.showInformationMessage(error)
				});
		});
	});

	context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
