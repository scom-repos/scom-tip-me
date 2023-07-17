export default {
    general: {
        dataSchema: {
            type: 'object',
            properties: {
                logo: {
                    type: 'string',
                    required: true
                },
                description: {
                    type: 'string',
                    required: true
                },
                recipient: {
                    type: 'string',
                    required: true
                },
                tokens: {
                    type: 'array',
                    required: true,
                    items: {
                        type: 'object',
                        properties: {
                            chainId: {
                                type: 'number',
                                enum: [1, 56, 137, 250, 97, 80001, 43113, 43114],
                                required: true
                            },
                            address: {
                                type: 'string',
                                required: true
                            }
                        }
                    }
                }
            }
        }
    },
    theme: {
        dataSchema: {
            type: 'object',
            properties: {
                "dark": {
                    type: 'object',
                    properties: {
                        backgroundColor: {
                            type: 'string',
                            format: 'color'
                        },
                        fontColor: {
                            type: 'string',
                            format: 'color'
                        },
                        inputBackgroundColor: {
                            type: 'string',
                            format: 'color'
                        },
                        inputFontColor: {
                            type: 'string',
                            format: 'color'
                        }
                    }
                },
                "light": {
                    type: 'object',
                    properties: {
                        backgroundColor: {
                            type: 'string',
                            format: 'color'
                        },
                        fontColor: {
                            type: 'string',
                            format: 'color'
                        },
                        inputBackgroundColor: {
                            type: 'string',
                            format: 'color'
                        },
                        inputFontColor: {
                            type: 'string',
                            format: 'color'
                        }
                    }
                }
            }
        }
    }
}