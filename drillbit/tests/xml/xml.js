describe("Ti.XML tests", {
	before_all: function() {
		this.countNodes = function(node, type) {
			var nodeCount = 0;
			type = typeof(type) == 'undefined' ? null : type;
			
			for (var i = 0; i < node.childNodes.length; i++) {
				var child = node.childNodes.item(i);
				if (type == null || child.nodeType == type) {
					nodeCount++;
					nodeCount += this.countNodes(child, type);
				}
			}
			return nodeCount;
		};
		
		var testFiles = ["soap.xml", "xpath.xml", "nodes.xml", "nodeCount.xml", "cdata.xml", "cdataEntities.xml"];
		var invalidFiles = [ "mismatched_tag.xml", "no_toplevel.xml", "no_end.xml"];
		this.testSource = {};
		this.invalidSource = {};
		for (var i = 0; i < testFiles.length; i++) {
			this.testSource[testFiles[i]] = Ti.Filesystem.getFile(testFiles[i]).read().toString();
		}
		
		for (var i = 0; i < invalidFiles.length; i++) {
			this.invalidSource[invalidFiles[i]] = Ti.Filesystem.getFile(invalidFiles[i]).read().toString();
		}
	},
	
	documentParsing: function() {
		var localSources = this.testSource;
		var localInvalid = this.invalidSource;
		// Parse valid documents
		valueOf(function() {
			Ti.XML.parseString(localSources["soap.xml"]);
		}).shouldNotThrowException();
		valueOf(function() {
			Ti.XML.parseString(localSources["xpath.xml"]);
		}).shouldNotThrowException();
		valueOf(function() {
			Ti.XML.parseString(localSources["nodes.xml"]);
		}).shouldNotThrowException();
		valueOf(function() {
			Ti.XML.parseString(localSources["nodeCount.xml"]);
		}).shouldNotThrowException();
		valueOf(function() {
			Ti.XML.parseString(localSources["cdata.xml"]);
		}).shouldNotThrowException();
		valueOf(function() {
			Ti.XML.parseString(localSources["cdataEntities.xml"]);
		}).shouldNotThrowException();
		
		// Parse empty document - spec specifies that a valid XML doc
		// must have a root element (empty string doesn't)
		valueOf(function() {
			Ti.XML.parseString('');
		}).shouldThrowException();
		
		// Parse (some types of) invalid documents
		valueOf(function() {
			Ti.XML.parseString(localInvalid["mismatched_tag.xml"]);
		}).shouldThrowException();
		valueOf(function() {
			Ti.XML.parseString(localInvalid["no_end.xml"]);
		}).shouldThrowException();
		valueOf(function() {
			Ti.XML.parseString(localInvalid["no_toplevel.xml"]);
		}).shouldThrowException();
	},
	
	// These 6 tests are adapted from the KitchenSink xml_dom test
	soap: function() {
		var xml = Ti.XML.parseString(this.testSource["soap.xml"]);
		var fooBarList = xml.documentElement.getElementsByTagName("FooBar");
		valueOf(fooBarList).shouldNotBeNull();
		valueOf(fooBarList.length).shouldBe(1);
		valueOf(fooBarList.item(0)).shouldBeObject();
		
		var item = fooBarList.item(0);
		valueOf(item.text).shouldBe("true");
		valueOf(item.nodeName).shouldBe("FooBar");
	},
	
	xpath: function() {
		var xml = Ti.XML.parseString(this.testSource["xpath.xml"]);
		var fooBarList = xml.documentElement.getElementsByTagName("FooBar");
		valueOf(fooBarList).shouldNotBeNull();
		valueOf(fooBarList.length).shouldBe(1);
		valueOf(fooBarList.item(0)).shouldBeObject();
		
		var item = fooBarList.item(0);
		valueOf(item.text).shouldBe("true");
		valueOf(item.nodeName).shouldBe("FooBar");
		
		// test XPath against Document
		var docResult = xml.evaluate("//FooBar/text()");
		valueOf(docResult).shouldNotBeNull();
		valueOf(docResult.length).shouldBe(1);
		valueOf(docResult.item(0).nodeValue).shouldBe("true");

		// test XPath against Element
		var elResult = xml.documentElement.evaluate("//FooBar/text()");
		valueOf(elResult).shouldNotBeNull();
		valueOf(elResult.length).shouldBe(1);
		valueOf(elResult.item(0).nodeValue).shouldBe("true");

		// test XPath against Element
		elResult = item.evaluate("text()");
		valueOf(elResult).shouldNotBeNull();
		valueOf(elResult.length).shouldBe(1);
		valueOf(elResult.item(0).nodeValue).shouldBe("true");
	},
	
	xmlNodes: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);
		var nodesList = doc.getElementsByTagName("nodes");

		valueOf(nodesList).shouldNotBeNull();
		valueOf(nodesList.length).shouldBe(1);
		
		var nodes = nodesList.item(0);
		var elements = nodes.getElementsByTagName("node");
		valueOf(elements).shouldNotBeNull();
		valueOf(elements.length).shouldBe(13);
		
		var children = nodes.childNodes;
		valueOf(children).shouldNotBeNull();
		valueOf(children).shouldBeObject();
		
		valueOf(this.countNodes(elements.item(0), 1)).shouldBe(6);
		valueOf(children.item).shouldBeFunction();

		elements = doc.firstChild.childNodes;
		valueOf(elements).shouldNotBeNull();
		valueOf(this.countNodes(nodes, 1)).shouldBe(13);
		
		valueOf(nodes.nodeName).shouldBe("nodes");
		valueOf(doc.documentElement.nodeName).shouldBe("response");
		valueOf(nodes.getAttribute("id"), "nodes");
		
		var node = nodes.getElementsByTagName("node").item(0);
		valueOf(node.getAttribute("id")).shouldBe("node 1");
		
		var subnodes = node.getElementsByTagName("node");
		valueOf(subnodes.item(0).getAttribute("id")).shouldBe("node 2");
	},
	
	xmlNodeCount: function() {
		var xml = Ti.XML.parseString(this.testSource["nodeCount.xml"]);
		var oneList = xml.documentElement.getElementsByTagName("one");
		var twoList = oneList.item(0).getElementsByTagName("two");
		var threeList = oneList.item(0).getElementsByTagName("three");
		var nodes = xml.getElementsByTagName("root");

		valueOf(oneList.length).shouldBe(1);
		valueOf(twoList.length).shouldBe(2);
		valueOf(threeList.length).shouldBe(4);
		
		var one = xml.documentElement.getElementsByTagName("one").item(0);
		var next = one.nextSibling;
		while (next != null && next.nodeType != next.ELEMENT_NODE) {
			next = next.nextSibling;
		}
		
		valueOf(one).shouldNotBeNull();
		valueOf(next).shouldNotBeNull();
		valueOf(one.nodeName).shouldBe("one");
		valueOf(xml.documentElement.attributes.getNamedItem("id").nodeValue).shouldBe("here");
		valueOf(next.getAttribute("id")).shouldBe("bar");
		valueOf(one.ownerDocument.documentElement.nodeName).shouldBe(xml.documentElement.ownerDocument.documentElement.nodeName);

		var nodeCount = this.countNodes(nodes.item(0), 1);
		valueOf(nodeCount).shouldBe(8);
	},
	
	xmlCData: function() {
		var xml = Ti.XML.parseString(this.testSource["cdata.xml"]);
		var scriptList = xml.documentElement.getElementsByTagName("script");
		valueOf(scriptList.length).shouldBe(1);
		
		valueOf(xml.documentElement.nodeName).shouldBe("root");
		var nodeCount = this.countNodes(xml.documentElement, 1);
		valueOf(nodeCount).shouldBe(1);
	},
	
	xmlCDataAndEntities: function() {
		var xml = Ti.XML.parseString(this.testSource["cdataEntities.xml"]);
		var dataList = xml.documentElement.getElementsByTagName("data");
		var subdataList = xml.documentElement.getElementsByTagName("subdata");
		valueOf(xml.documentElement.firstChild.nodeName).shouldBe("subdata");
		
		var nodeCount = this.countNodes(subdataList.item(0), 1);
		valueOf(nodeCount).shouldBe(2);
	},
	
	xmlSerialize: function() {
		// Return an array of attribute nodes, sorted by name.
		// An attribute NamedNodeMap has no canonical ordering,
		// so to do a comparison we need to ensure we've got the
		// same order between both.
		function sortAttributeList(attribs) {
			var names = [];
			var map = {};
			for (var i = 0; i < attribs; i++) {
				var a = attribs.item(i);
				map[a.nodeName] = a;
				names.push(a.nodeName);
			}
			
			names = names.sort();
			var list = [];
			for (var i = 0; i < names.length; i++) {
				list.push(map[names[i]]);
			}
			return list;
		}
		
		function matchXmlTrees(a, b) {
			valueOf(a.nodeType).shouldBe(b.nodeType);
			valueOf(a.nodeName).shouldBe(b.nodeName);
			valueOf(a.nodeValue).shouldBe(b.nodeValue);
			
			if (a.nodeType == 1) {
				var aAttribs = sortAttributeList(a.attributes);
				var bAttribs = sortAttributeList(b.attributes);
				valueOf(aAttribs.length).shouldBe(bAttribs.length);
				
				for (var i = 0; i < aAttribs.length; i++) {
					matchXmlTrees(aAttribs[i], bAttribs[i]);
				}
				
				var aChildren = a.childNodes;
				var bChildren = b.childNodes;
				valueOf(aChildren.length).shouldBe(bChildren.length);

				for (var i = 0; i < aChildren.length; i++) {
					matchXmlTrees(aChildren.item(i), bChildren.item(i));
				}
			}
		}
		
		for (var sourceName in this.testSource) {
			var a = Ti.XML.parseString(this.testSource[sourceName]);
			var bstr = Ti.XML.serializeToString(a);
			var b = Ti.XML.parseString(bstr);
			
			// Make sure we can round-trip from source to DOM to source and back to DOM...
			matchXmlTrees(a, b);
		}
	},

	xmlNodeListElementsByTagName : function() {
		var xml = Ti.XML.parseString(this.testSource["nodes.xml"]);
		valueOf(xml).shouldNotBeNull();
		
		var nodes = xml.getElementsByTagName("node");
		valueOf(nodes).shouldNotBeNull();
		valueOf(nodes.length).shouldBeNumber();
		valueOf(nodes.item).shouldBeFunction();
		
		valueOf(nodes.length).shouldBe(13);
		
		var n = nodes.item(0);
		valueOf(n).shouldNotBeNull();
		valueOf(n.getAttribute("id")).shouldBe("node 1");
		
		n = nodes.item(1);
		valueOf(n).shouldNotBeNull();
		valueOf(n.getAttribute("id")).shouldBe("node 2");
	},

	xmlNodeListChildren : function() {
		var xml = Ti.XML.parseString(this.testSource["nodes.xml"]);
		valueOf(xml).shouldNotBeNull();
		
		var e = xml.documentElement;
		valueOf(e).shouldNotBeNull();
		
		var nodes = e.childNodes;
		valueOf(nodes).shouldNotBeNull();
		var count = 0;
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes.item(i);
			if (node.nodeType == node.ELEMENT_NODE) {
				count++;
			}
		}
		valueOf(count).shouldBe(1);
	},

	xmlNodeListRange : function() {
		var xml = Ti.XML.parseString(this.testSource["nodes.xml"]);
		valueOf(xml).shouldNotBeNull();
		
		var nodes = xml.getElementsByTagName("node");
		valueOf(nodes.item(nodes.length)).shouldBeNull();
		valueOf(nodes.item(100)).shouldBeNull();
	},

	apiXmlAttr: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);
		var node = doc.getElementsByTagName("node").item(0);
		var attr;
		// First a known attribute
		valueOf(function(){
			attr = node.attributes.item(0);
		}).shouldNotThrowException();
		valueOf(attr).shouldNotBeUndefined();
		valueOf(attr).shouldNotBeNull();
		valueOf(attr).shouldBeObject();
		valueOf(attr.name).shouldBeString();
		valueOf(attr.name).shouldBe("id");
		valueOf(attr.ownerElement).shouldBeObject();
		valueOf(attr.ownerElement).shouldBe(node); // For some reason this doesn't work on android TIMOB-4703
		valueOf(attr.specified).shouldBeBoolean();
		valueOf(attr.specified).shouldBeTrue();
		valueOf(attr.value).shouldBeString();
		valueOf(attr.value).shouldBe("node 1");
		// Now new attribute
		valueOf(function(){
			attr = doc.createAttribute("newattr");
		}).shouldNotThrowException();
		valueOf(attr).shouldNotBeUndefined();
		valueOf(attr).shouldNotBeNull();
		valueOf(attr).shouldBeObject();
		valueOf(attr.name).shouldBeString();
		valueOf(attr.name).shouldBe("newattr");
		valueOf(attr.specified).shouldBeBoolean();
		var addedAttr = node.setAttributeNode(attr); // NPE for some reason in Android. TIMOB-4704
		valueOf(addedAttr).shouldNotBeNull();
		valueOf(addedAttr).shouldBeObject();
		valueOf(addedAttr).shouldBe(attr);
		valueOf(attr.ownerElement).shouldNotBeNull();
		valueOf(attr.ownerElement).shouldBe(node); // For some reason this doesn't work on android TIMOB-4703
		valueOf(attr.specified).shouldBeFalse();
		valueOf(attr.value).shouldBeNull();
		attr.value = "new value";
		valueOf(attr.value).shouldBe("new value");
		valueOf(attr.specified).shouldBeTrue();
	}
});
