class React {

    constructor() {
        this.nextUnitOfWork = null;
        this.wipRoot = null;
        this.currentRoot = null;
        requestIdleCallback(this.workLoop.bind(this));
    }

    createElement(type, props, ...children) {
        return {
            type,
            props: {
                ...props,
                children: children.map(child =>
                    typeof child === "object" ?
                        child :
                        this.createTextElement(child))
            }
        }
    }

    createTextElement(text) {
        return {
            type: "TEXT_ELEMENT",
            props: {
                nodeValue: text,
                children: []
            }
        }
    }

    createDom(fiber) {
        const dom =
            fiber.type == "TEXT_ELEMENT"
                ? document.createTextNode("")
                : document.createElement(fiber.type)

        const isProperty = key => key !== "children"

        Object.keys(fiber.props)
            .filter(isProperty)
            .forEach(name => {
                dom[name] = fiber.props[name]
            })

        return dom
    }



    render(element, container) {

        this.wipRoot = {
            dom: container,
            props: {
                children: [element],
            },
            alternate: this.currentRoot,
        }

        this.nextUnitOfWork = this.wipRoot;
    }

    commitRoot() {
        this.commitWork(this.wipRoot.child)
        this.currentRoot = this.wipRoot
        this.wipRoot = null
    }

    commitWork(fiber) {
        if (!fiber) {
            return
        }

        const domParent = fiber.parent.dom

        domParent.appendChild(fiber.dom)

        this.commitWork(fiber.child)

        this.commitWork(fiber.sibling)
    }

    workLoop(deadline) {
        let shouldYield = false

        while (this.nextUnitOfWork && !shouldYield) {
            this.nextUnitOfWork = this.performUnitOfWork(this.nextUnitOfWork)

            shouldYield = deadline.timeRemaining() < 1
        }

        if (!this.nextUnitOfWork && this.wipRoot) {
            this.commitRoot()
        }

        requestIdleCallback(this.workLoop.bind(this))
    }


    performUnitOfWork(fiber) {
        if (!fiber.dom) {
            fiber.dom = this.createDom(fiber)
        }

        const elements = fiber.props.children

        this.reconcileChildren(fiber, elements)

        if (fiber.child) {
            return fiber.child
        }

        let nextFiber = fiber

        while (nextFiber) {
            if (nextFiber.sibling) {
                return nextFiber.sibling
            }
            nextFiber = nextFiber.parent
        }
    }
    reconcileChildren(wipFiber, elements) {
        let index = 0
        let prevSibling = null

        while (index < elements.length) {
            const element = elements[index]

            const newFiber = {
                type: element.type,
                props: element.props,
                parent: wipFiber,
                dom: null,
            }

            if (index === 0) {
                wipFiber.child = newFiber
            } else {
                prevSibling.sibling = newFiber
            }

            prevSibling = newFiber
            index++
        }
    }


}



const ReactLib = new React()


const element = ReactLib.createElement(
    "div",
    { id: "foo" },
    ReactLib.createElement("h1", null, "bar"),
    "test"
);


const container = document.getElementById("root")

ReactLib.render(element, container)
