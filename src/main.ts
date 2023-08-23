import open from "open";
import { Flow, JSONRPCResponse } from "./lib/flow";
import { z } from "zod";
import logger from "./lib/logger";
import childProcess from "child_process";
import axios from 'axios';

// The events are the custom events that you define in the flow.on() method.
const events = ["search", "copyToClipboard", "openGoogleMap"] as const;
type Events = (typeof events)[number];

const flow = new Flow<Events>("src/assets/favicon.ico");

const copy = (content: string) => childProcess.spawn("clip").stdin.end(content);


flow.on("query", async (params) => {
	const [query] = z.array(z.string()).parse(params);
	// logger.info("get query: " + query );

	const result: JSONRPCResponse<Events>[] = [];
	await axios.get(`https://ipwho.is/${query}`)
		.then(function (response) {
			// handle success
			if (response.data.success) {
				result.push({
					title: `${response.data.type}: ${response.data.ip}`,
					subtitle: `Click & Copy to Clipboard`,
					method: "copyToClipboard",
					parameters: [`${response.data.ip}`],
					dontHideAfterAction: true,
				})

				result.push({
					title: `Geo: ${response.data.latitude},${response.data.longitude}`,
					subtitle: `Click & Redirect to Google Map`,
					method: "openGoogleMap",
					parameters: [`${response.data.latitude},${response.data.longitude}`],
					dontHideAfterAction: true,
				})

				result.push({
					title: `Country: ${response.data.country} `,
					subtitle: `Click & Copy to Clipboard`,
					method: "copyToClipboard",
					parameters: [`${response.data.country}`],
					dontHideAfterAction: true,
				})

				result.push({
					title: `Region: ${response.data.region} `,
					subtitle: `Click & Copy to Clipboard`,
					method: "copyToClipboard",
					parameters: [`${response.data.region}`],
					dontHideAfterAction: true,
				})

				result.push({
					title: `City: ${response.data.city} `,
					subtitle: `Click & Copy to Clipboard`,
					method: "copyToClipboard",
					parameters: [`${response.data.city}`],
					dontHideAfterAction: true,
				})
			} else {
				result.push({
					title: `${response.data.message}`,
					subtitle: ``,
					parameters: [`${response.data.message}`],
					dontHideAfterAction: true,
				})
			}
		})
		.catch(function (error) {
			logger.info(error);
			result.push({
				title: `Err`,
				subtitle: ``,
				parameters: [],
				dontHideAfterAction: true,
			})
		});
	
	flow.showResult(...result);
});

// 复制到粘贴板
flow.on("copyToClipboard", (parameters) => {
	copy(`${parameters[0]}`)
	// logger.info("copyToClipboard: " + parameters[0] );
});

flow.on("openGoogleMap", (parameters) => {
	open(`https://www.google.com/maps/search/${parameters[0]}`);
});

flow.run();
