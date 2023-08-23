import open from "open";
import { Flow, JSONRPCResponse } from "./lib/flow";
import { z } from "zod";
import logger from "./lib/logger";
import childProcess from "child_process";
import axios from 'axios';
import Cache from "file-system-cache";

// The events are the custom events that you define in the flow.on() method.
const events = ["search", "copyToClipboard", "openGoogleMap"] as const;
type Events = (typeof events)[number];

const flow = new Flow<Events>("src/assets/favicon.ico");

const copy = (content: string) => childProcess.spawn("clip").stdin.end(content);

const myCache = Cache( {
	basePath: "./cache", // (optional) Path where cache files are stored (default).
  	ns: "ipLocation",   // (optional) A grouping namespace for items.
  	hash: "sha1",          // (optional) A hashing algorithm used within the cache key.
    ttl: 172800            // (optional) A time-to-live (in secs) on how long an item remains cached.
});

flow.on("query", async (params) => {
	const [query] = z.array(z.string()).parse(params);
	// logger.info("get query: " + query );

	if(query === 'clear')
	{
		myCache.clear()
		flow.showResult({
			title: `Clear cache success!`,
			subtitle: `Noitce`,
			dontHideAfterAction: true,
		})
		return;
	}

	const result: JSONRPCResponse<Events>[] = [];

	const cacheKey = query.length > 0 ? query : 'current_ip';

	let data = {
		ip: "",
		success: true,
		type: "",
		country: "",
		region: "",
		city: "",
		latitude: 0,
		longitude: 0,
	};

	const cacheData = await myCache.get( cacheKey, {})

	if(cacheData !== null && Object.keys(cacheData).length > 0) {
		data = cacheData
	} else {

		await axios.get(`https://ipwho.is/${query}`)
		.then(function (response) {
			// handle success
			if (response.data.success) {
				myCache.set(cacheKey, response.data, 172800)

				data = response.data
				
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
			flow.showResult({
				title: `Err`,
				subtitle: ``,
				parameters: [],
				dontHideAfterAction: true,
			})
		});
 
	}

	if(Object.keys(data).length > 0) {
		result.push({
			title: `${data.type}: ${data.ip}`,
			subtitle: `Click & Copy to Clipboard`,
			method: "copyToClipboard",
			parameters: [`${data.ip}`],
			dontHideAfterAction: true,
		})

		result.push({
			title: `Geo: ${data.latitude},${data.longitude}`,
			subtitle: `Click & Redirect to Google Map`,
			method: "openGoogleMap",
			parameters: [`${data.latitude},${data.longitude}`],
			dontHideAfterAction: true,
		})

		result.push({
			title: `Country: ${data.country} `,
			subtitle: `Click & Copy to Clipboard`,
			method: "copyToClipboard",
			parameters: [`${data.country}`],
			dontHideAfterAction: true,
		})

		result.push({
			title: `Region: ${data.region} `,
			subtitle: `Click & Copy to Clipboard`,
			method: "copyToClipboard",
			parameters: [`${data.region}`],
			dontHideAfterAction: true,
		})

		result.push({
			title: `City: ${data.city} `,
			subtitle: `Click & Copy to Clipboard`,
			method: "copyToClipboard",
			parameters: [`${data.city}`],
			dontHideAfterAction: true,
		})

	} else {
		flow.showResult({
			title: `Err`,
			subtitle: ``,
			parameters: [],
			dontHideAfterAction: true,
		})
	}
	
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
