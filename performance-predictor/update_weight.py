import numpy as np
def update_weights(weights, gradient, alpha):
    new_weights = (weights -(alpha*gradient))
    return new_weights


if __name__ =="__main__":
    weights = np.array([0.5, 0.5, 0.5])
    gradient = np.array([0.1, -0.2, 0.0])
    alpha = 0.1

    print(update_weights(weights, gradient, alpha))