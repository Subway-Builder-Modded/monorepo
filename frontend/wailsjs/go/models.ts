export namespace main {
	
	export class UpdateConfig {
	    type: string;
	    repo?: string;
	    url?: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.repo = source["repo"];
	        this.url = source["url"];
	    }
	}
	export class MapManifest {
	    schema_version: number;
	    id: string;
	    name: string;
	    author: string;
	    github_id: number;
	    city_code: string;
	    country: string;
	    population: number;
	    description: string;
	    tags: string[];
	    gallery: string[];
	    source: string;
	    update: UpdateConfig;
	
	    static createFrom(source: any = {}) {
	        return new MapManifest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.schema_version = source["schema_version"];
	        this.id = source["id"];
	        this.name = source["name"];
	        this.author = source["author"];
	        this.github_id = source["github_id"];
	        this.city_code = source["city_code"];
	        this.country = source["country"];
	        this.population = source["population"];
	        this.description = source["description"];
	        this.tags = source["tags"];
	        this.gallery = source["gallery"];
	        this.source = source["source"];
	        this.update = this.convertValues(source["update"], UpdateConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ModManifest {
	    schema_version: number;
	    id: string;
	    name: string;
	    author: string;
	    github_id: number;
	    description: string;
	    tags: string[];
	    gallery: string[];
	    source: string;
	    update: UpdateConfig;
	
	    static createFrom(source: any = {}) {
	        return new ModManifest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.schema_version = source["schema_version"];
	        this.id = source["id"];
	        this.name = source["name"];
	        this.author = source["author"];
	        this.github_id = source["github_id"];
	        this.description = source["description"];
	        this.tags = source["tags"];
	        this.gallery = source["gallery"];
	        this.source = source["source"];
	        this.update = this.convertValues(source["update"], UpdateConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

