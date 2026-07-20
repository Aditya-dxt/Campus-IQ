from sigmoid import sigmoid
from log_loss import average_log_loss
from gradient_descent import compute_gradient
from update_weight import update_weights
from bias_gradient import compute_bias_gradient
import numpy as np

def train(X, y, weights, b, alpha, epochs):
    for epoch in range(epochs):
        z =  ((X@weights)+b)              
        y_hat = sigmoid(z)
        loss = average_log_loss(y, y_hat)
        gradient = compute_gradient(X, y, y_hat)
        bias_gradient = compute_bias_gradient(y,y_hat)   
        weights = update_weights(weights, gradient, alpha)
        b = (b-(alpha*bias_gradient))            

        if epoch % 100 == 0:
            print(f"Epoch {epoch}, Loss: {loss}")

    return weights, b



